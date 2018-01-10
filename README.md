# Metrics Collector Service

Metrics Collector Service tracks deployments of sample workloads to IBM Cloud and Watson platform deployed on Cloud Foundry, Kubernetes, OpenWhisk, Data Science Experience and others, and the usage of associated services

![Flow](images/metrics-service.png)

> To enable tracking for your sample applications, follow [these instructions](#clients)

[**_View a summary of deployments tracked._**](https://metrics-tracker.mybluemix.net/)

## Cloning

Get the project and change into the project directory:

    $ git clone https://github.com/IBM/metrics-collector-service.git
    $ cd metrics-collector-service

## Configuring Local Development

Local configuration is done through a `.env` file. Two environment variables, `VCAP_SERVICES` and `WRITE_KEY`, are needed in order to configure your local development environment. The value of the `VCAP_SERVICES` is a string representation of a JSON object, and `WRITE_KEY` is the Segment Write Key in string format. Here is an example `.env` file:

    VCAP_SERVICES={"cloudantNoSQLDB": [{"name": "deployment-tracker-db","label": "cloudantNoSQLDB","plan": "Lite","credentials": {"username": "your-username","password": "your-password","host": "your-host","port": 443,"url": "https://your-username:your-password@your-host"}}]}
    WRITE_KEY="Your Segment Write Key"

**Note:**  Services created within IBM Cloud are automatically added to the `VCAP_SERVICES` environment variable. Therefore, no configuration is needed for IBM Cloud.

## Installing

Install the project's dependencies:

    $ npm install

## Running

Run the project through [Foreman](https://github.com/ddollar/foreman):

    $ foreman start

## Configuring IBM Cloud

Complete these steps first if you have not already:

1. [Install the Cloud Foundry command line interface.](https://www.ng.bluemix.net/docs/#starters/install_cli.html)
2. Follow the instructions at the above link to connect to IBM Cloud.
3. Follow the instructions at the above link to log in to IBM Cloud.

Create a Cloudant service within IBM Cloud if one has not already been created:

    $ cf create-service cloudantNoSQLDB Lite deployment-tracker-db

> Use the [Standard plan](https://www.ibm.com/blogs/bluemix/2016/09/new-cloudant-lite-standard-plans-are-live-in-bluemix-public/) for production deployments.

Create a Redis service within IBM Cloud if one has not already been created:

    $ cf create-service rediscloud 30mb deployment-tracker-redis-redis-cloud

## Deploying

To deploy to IBM Cloud, simply:

    $ cf push

## Clients

There are a number of language and platform specific clients for the deployment tracker, including:

- [Node.js](https://github.com/IBM/metrics-collector-client-node)
- [Python](https://github.com/IBM/metrics-collector-client-python)
- [Java](https://github.com/IBM/metrics-collector-client-java)
- [Swift](https://github.com/metrics-collector-client-swift)
- [Kubernetes](https://github.com/IBM/metrics-collector-client-kubernetes)

### Client testing
Clients can request payload validation by including `"test": true` in the payload. 
> The payload is not persisted.

Success response (HTTP code 200):

```
{ok: true}
```

Failure response (HTTP code 400):

```
{
	ok: false,
	missing: ["missing_property_id", ...]
}
```

## Privacy Notice

This web application includes code to track deployments to [IBM Cloud](https://www.bluemix.net/) runtimes and services. The following information is sent to a [Metrics Tracker](https://github.com/IBM/metrics-collector-service) service on each deployment:

* Application Name (`application_name`)
* Application GUID (`application_id`)
* Application instance index (`instance_index`)
* Space ID (`space_id`)
* Application Version (`application_version`)
* Application URIs (`application_uris`)
* Labels of bound services
* Number of instances for each bound service

This data is collected from the `VCAP_APPLICATION` and `VCAP_SERVICES` environment variables in IBM Cloud. This data is used by IBM to track metrics around deployments of sample applications to IBM Cloud to measure the usefulness of our examples, so that we can continuously improve the content we offer to you. Only deployments of sample applications that include code to ping the Deployment Tracker service will be tracked.

### Disabling Deployment Tracking

Disabling the deployment tracker varies based on sample application implementation. Please include specific disabling instructions within your README's Privacy Notice.

### Include This Privacy Notice

When you apply deployment tracking code to an app, you must add the following privacy notice to its README (provided here in markdown format). Note that you must insert specific instructions for your app, telling readers how to disable deployment tracking.

```
## Privacy Notice

This application includes code that tracks deployments to [IBM Cloud](https://www.bluemix.net/) and other platforms. The creator of this app added tracking to count deployments and better serve developers. It records only basic information about the deployment. [See details](https://github.com/IBM/metrics-collector-service#privacy-notice). If you want to disable deployment tracking, follow these steps:

<INSERT REMOVAL STEPS FOR YOUR APP>

```

## License

Licensed under the [Apache License, Version 2.0](LICENSE.txt).
