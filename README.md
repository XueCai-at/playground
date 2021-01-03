# Xue's playground to prototype AWS service deployment and orchestration

This repo contains a Node.js web app and configuration files
to dockerize/build (with AWS CodeBuild), launch (in AWS ECS/Fargate),
and deploy (with AWS CodeBuild) the web app.

The web app is being continously deployed by two pipelines (with AWS CodePipeline).
- pipeline 1: Source (GitHub) -> Build (CodeBuild) -> Deploy (ECS standard rolling-update deployment)
- pipeline 2: Source (GitHub) -> Build (CodeBuild) -> Deploy (ECS blue/green deployment with CodeDeploy, [ECSCanary10Percent5Minutes](https://aws.amazon.com/blogs/containers/aws-codedeploy-now-supports-linear-and-canary-deployments-for-amazon-ecs/))

You can visit the running ECS service at
- pipeline 1: http://ec2co-ecsel-5nde7v2f4a7a-1733327502.us-west-2.elb.amazonaws.com/version
- pipeline 2: http://xue-test-service-blue-green-alb-382889407.us-west-2.elb.amazonaws.com/version

## Node.js web app (server.js, package.json)
- Simple web app running on port 8080 (container port).
- '/version' route displays running code version.
- '/' route is by default used for health check by AWS ALB's target groups. Can send 500 to simulate unhealthy server instances.

## Dockerize the app (Dockerfile)
- Follow [this guide](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/).

Try locally by running

```bash
$ docker build --build-arg COMMIT_HASH=42 -t xue-test .
$ docker run -p 8080:8080 -d xue-test
```

Then visit http://0.0.0.0:8080 or http://0.0.0.0:8080/version

You can also view server logs by running

```bash
$ docker logs <container_id>
```

## CodeBuild the app (buildspec.yml)
In a Continuous Deployment (CD) setup, we don't want to build the docker image on our laptops.
Instead, we build the image using AWS CodeBuild.

- Follow [this guide](https://docs.aws.amazon.com/codebuild/latest/userguide/sample-docker.html).
- Environment variables are configured in the CodeBuild project on AWS console.
- Environment variable *CODEBUILD_RESOLVED_SOURCE_VERSION* tells which code version is built.
- The built docker image is pushed to AWS ECR *$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:latest*
- Build artifacts include:
    - *imagedefinitions.json*: input for pipeline 1's deploy stage
    - *taskdef.json*, *appspec.yml*: input for pipeline 2's deploy stage
- Because Docker Hub rate limit pulls, I created a separate free account (*xuecaiat*) instead of sharing fate with other AWS CodeBuild projects.

## Launch the dockerized app in AWS ECS (taskdef.json)
Once the docker image is in AWS ECR, we can launch ECS/Fargate services with it.

- Follow [this guide](https://docs.aws.amazon.com/AmazonECS/latest/userguide/fargate-getting-started.html).
- Besides ECS task definition (taskdef.json), there are more (such as ECS cluster, ECS service, VPC, subnet, security group, Application Load Balancer (ALB)) configured on AWS console (see guide above for details).
- The task runs with IAM role *ecsTaskExecutionRole*.
- The task includes one container with the image we built earlier and stored in ECR (Note that a task can include multiple containers of which one can contain a Datadog agent).
- The task requires *FARGATE* launch type.
- The task needs 256 cpu, 512 memory, and uses *awsvpc* network mode.

The ECS/Fargate service can be visited via the ALB's DNS name.
We configured the ALB to listen to port 80 and forward to port 8080 of running ECS/Fargate server instances.

An ECS service configures how many (*N*) tasks to run.
We configured N = 2, so there should be 2 server instances running.

## CodePipeline to continuously deploy the app
As mentioned above, we have two pipelines to continuously deploy the app.
These two pipelines' source and build stages are identical, but with different deploy setups.
These two pipelines deploy the app to two ECS/Fargate services, with two separate ALBs in front.
Below are the two ALBs' public DNS names:
- pipeline 1: *ec2co-ecsel-5nde7v2f4a7a-1733327502.us-west-2.elb.amazonaws.com*
- pipeline 2: *xue-test-service-blue-green-alb-382889407.us-west-2.elb.amazonaws.com*

### Source Stage
- output: Github repo

### Build Stage
- input:
    - Github repo
    - Docker Hub *node:12* base image
- output:
    - Docker image stored in AWS ECR
    - imagedefinitions.json (for ECS standard rolling-update deployment)
    - taskdef.json, appspec.yml (for ECS blue/green deployment with CodeDeploy)

### Deploy Stage

#### ECS standard rolling-update deployment
- input:
    - Docker image stored in AWS ECR
    - imagedefinitions.json (for ECS standard rolling-update deployment)

- Follow [this guide](https://docs.aws.amazon.com/codepipeline/latest/userguide/ecs-cd-pipeline.html).

When an ECS service is created, we need to select a deployment controller which can't be changed later.
If selecting rolling update, the ECS service is set up with
- 1 ALB
- 1 target group
    - to which the ALB forward traffic to
    - in which the deployment controller registers tasks that run new code version

In a default rolling-update deployment, N more tasks with new code version are registered in the target group,
and traffic is forwarded to them by the ALB.
Tasks with old code version are eventually deregistered, leaving N running tasks in a steady state.

The target group configures health check, deregistration delay, and load balancing algorithm (round robin, least outstanding requests).
If new tasks fail health check, eventually the deployment will timeout, leaving only tasks with old code version.

#### ECS blue/green deployment with CodeDeploy (appspec.yml)
- input:
    - Docker image stored in AWS ECR
    - taskdef.json, appspec.yml (for ECS blue/green deployment with CodeDeploy)

- Follow [this guide](https://docs.aws.amazon.com/codepipeline/latest/userguide/tutorials-ecs-ecr-codedeploy.html).

When an ECS service is created with CodeDeploy blue/green deployment controller, the ECS service is set up with
- 1 ALB
- 2 target groups
    - to which the ALB forward traffic to with weights. For example,
        - target-group-1: 90% (tasks with old code version, blue)
        - target-group-2: 10% (tasks with new code version, green)
    - in which the deployment controller registers tasks that run new code version
        - different from rolling-update deployment, new tasks are registered in the standby target group

In a default blue/green deployment with *ECSCanary10Percent5Minutes*,
if before the deployment the ALB forwards 100% traffic to target-group-1,
then the deployment controller (CodeDeploy) will perform the following steps:
- register tasks with new code version to target-group-2
- route 10% traffic to target-group-2, and wait for 5 minutes
- route 100% traffic to target-group-2, and wait for 1 hour (default)
- terminate tasks with old code version

If new tasks fail health check, eventually the deployment will fail and traffic will be
rolled back to target-group-1.
You can also set up AWS CloudWatch alarms to automatically reverse the traffic routing.