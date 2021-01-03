# Xue's playground to prototype AWS service deployment and orchestration

This repo contains a Node.js web app and configuration files
to dockerize/build (with AWS CodeBuild), launch (in AWS ECS/Fargate),
and deploy (with AWS CodeBuild) it.

The web app is being continously deployed by two pipelines (with AWS CodePipeline).
- pipeline 1: Source (GitHub) -> Build (CodeBuild) -> Deploy (ECS standard rolling-update deployment)
- pipeline 2: Source (GitHub) -> Build (CodeBuild) -> Deploy (CodeDeploy blue/green deployment to ECS)

You can visit the running ECS service at
- pipeline 1: http://ec2co-ecsel-5nde7v2f4a7a-1733327502.us-west-2.elb.amazonaws.com:8080/version
- pipeline 2: http://xue-test-service-blue-green-alb-382889407.us-west-2.elb.amazonaws.com/version

## A Node.js web app (server.js, package.json)
- Simple web app running on port 8080 (container port).
- '/version' route displays running code version.
- '/' route is by default used for health check by AWS ALB's target groups. Can send 500 to simulate unhealthy server instances.

## Dockerize the app (Dockerfile)
- Follow [this guide](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/).

Try locally by running
    docker build --build-arg COMMIT_HASH=42 -t xue-test .
    docker run -p 8080:8080 -d xue-test
Then visit http://0.0.0.0:8080 or http://0.0.0.0:8080/version

You can also view server logs by running
    docker logs <container_id>

## CodeBuild the app (buildspec.yml)
In a Continuous Deployment (CD) setup, we don't want to build the docker image on our laptops.
Instead, we build the image using AWS CodeBuild.

- Follow [this guide](https://docs.aws.amazon.com/codebuild/latest/userguide/sample-docker.html).
- Environment variables are configured in the CodeBuild project on AWS console.
- Environment variable *CODEBUILD_RESOLVED_SOURCE_VERSION* tells which code version is built.
- The built docker image is pushed to AWS ECR *$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:latest*
- Build artifacts include:
-- imagedefinitions.json: input for pipeline 1's deploy stage
-- taskdef.json, appspec.yml: input for pipeline 2's deploy stage
- Because Docker Hub rate limit pulls, I created a separate free account (*xuecaiat*) instead of sharing fate with other AWS CodeBuild projects.

## Launch the dockerized app in AWS ECS (taskdef.json)
Once the docker image is in AWS ECR, we can launch ECS/Fargate services with it.

- Follow [this guide](https://docs.aws.amazon.com/AmazonECS/latest/userguide/fargate-getting-started.html).
- Besides ECS task definition (taskdef.json), there are more configured on AWS console (see guide above).
- The task runs with IAM role *ecsTaskExecutionRole*.
- The task includes one container with the image in ECR (a task can include multiple containers).
- The task requires *FARGATE* launch type.
- The task needs 256 cpu, 512 memory, and uses *awsvpc* network mode.

## CodePipeline to continuously deploy the app
As mentioned above, we have two pipelines to continuously deploy the app.
These two pipelines' source and build stages are identical, but with different deploy setups.
These two pipelines deploy the app to two ECS/Fargate services, with two separate ALBs in front.
Below are the two ALBs' public domain names:
- pipeline 1: *ec2co-ecsel-5nde7v2f4a7a-1733327502.us-west-2.elb.amazonaws.com*
- pipeline 2: *xue-test-service-blue-green-alb-382889407.us-west-2.elb.amazonaws.com*

### ECS standard rolling-update deployment
- Follow [this guide](https://docs.aws.amazon.com/codepipeline/latest/userguide/ecs-cd-pipeline.html).

### CodeDeploy the app with blue/green deployment (appspec.yml)
- Follow [this guide](https://docs.aws.amazon.com/codepipeline/latest/userguide/tutorials-ecs-ecr-codedeploy.html).