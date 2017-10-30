#!/usr/bin/env node
// Licensed under the Apache 2.0 License. See footer for details.

var express = require("express"),
    http = require("http"),
    path = require("path"),
    cloudant = require("cloudant"),
    program = require("commander"),
    dotenv = require("dotenv"),
    crypto = require("crypto"),
    pkg = require(path.join(__dirname, "package.json"));

http.post = require("http-post");

dotenv.load();

var app = express();

(function(app) {
  if (process.env.VCAP_SERVICES) {
    var vcapServices = JSON.parse(process.env.VCAP_SERVICES);
    app.set("vcapServices", vcapServices);
    if (vcapServices.cloudantNoSQLDB && vcapServices.cloudantNoSQLDB.length > 0) {
      var service = vcapServices.cloudantNoSQLDB[0];
      if (service.credentials) {
        app.set("deployment-tracker-db", cloudant({
          username: service.credentials.username,
          password: service.credentials.password,
          account: service.credentials.username
        }));
      }
    }
  }
})(app);

program.version(pkg.version);

program
  .command("db <method>")
  .description("Create (put) or delete the database")
  .action(function(method) {
    var deploymentTrackerDb = app.get("deployment-tracker-db");
    if (!deploymentTrackerDb) {
      console.error("No database configured");
      return;
    }
    switch (method) {
      case "put":
        deploymentTrackerDb.db.create("events", function(err) {
          if (!err) {
            console.log("Deployment tracker events database created");
          } else {
            if (412 === err.statusCode) {
              console.log("Deployment tracker events database already exists");
            } else {
              console.error("Error creating deployment tracker events database");
            }
          }
        });
        break;
      case "delete":
        deploymentTrackerDb.db.destroy("events", function(err) {
          if (!err) {
            console.log("Deployment tracker events database deleted");
          } else {
            if (404 === err.statusCode) {
              console.log("Deployment tracker events database does not exist");
            } else {
              console.error("Error deleting deployment tracker events database");
            }
          }
        });
        break;
    }
  }).on("--help", function() {
    console.log("  Examples:");
    console.log();
    console.log("    $ db put");
    console.log("    $ db delete");
    console.log();
  });

program
  .command("ddoc <method>")
  .description("Create (put) or delete design documents")
  .action(function(method) {
    var deploymentTrackerDb = app.get("deployment-tracker-db");
    if (!deploymentTrackerDb) {
      console.error("No database configured");
      return;
    }
    var eventsDb = deploymentTrackerDb.use("events");
    switch (method) {
      case "put":
        // TODO: Allow this to handle migrations
        var ddoc = {
          _id: "_design/deployments",
          views: {
            by_repo: {
              map: "function(doc) { if (doc.repository_url && doc.repository_url !== '') { " +
                "if(! doc.hasOwnProperty('instance_index') || " +
                "(doc.hasOwnProperty('instance_index') && doc.instance_index == '0')) { " +
                "emit([doc.repository_url, doc.date_received.substring(0, 4), " +
                "doc.date_received.substring(5, 7), doc.date_received.substring(8, 10), doc.space_id, " +
                "doc.application_version]); } } }",
              reduce: "_count",
            },
            by_repo_unique: {
              map: "function(doc) { if (doc.repository_url && doc.repository_url !== '') { " +
                "if(! doc.hasOwnProperty('instance_index') || " +
                "(doc.hasOwnProperty('instance_index') && doc.instance_index == '0')) { " +
                "emit([doc.repository_url, doc.date_received.substring(0, 4), doc.date_received.substring(5, 7), doc.space_id]); } } }",
              reduce: "_count",
            },
            by_runtime_service: {
              map: "function(doc) { if (doc.config.target_services && doc.config.target_services !== []) { "+
              "for (var i = 0; i < doc.config.target_services.length; i++) { emit([doc.config.target_services[i],'services']);"+
              " } } if (doc.config.target_runtimes && doc.config.target_runtimes !== []) {"+
              "for (var j = 0; j < doc.config.target_runtimes.length; j++) { emit([doc.config.target_runtimes[j],'runtimes']);"+
              " } } if (doc.runtime && doc.runtime !== '') { emit([doc.runtime, 'language']); } }",
              reduce: "_count",
            },
            by_runtime_service_unique: {
              map: "function(doc) { if (doc.config.target_services && doc.config.target_services !== []) { "+
              "for (var i = 0; i < doc.config.target_services.length; i++) { emit([doc.config.target_services[i],'services', doc.space_id]);"+
              " } } if (doc.config.target_runtimes && doc.config.target_runtimes !== []) {"+
              "for (var j = 0; j < doc.config.target_runtimes.length; j++) { emit([doc.config.target_runtimes[j],'runtimes', doc.space_id]);"+
              " } } if (doc.runtime && doc.runtime !== '') { emit([doc.runtime, 'language', doc.space_id]); } }",
              reduce: "_count",
            },
            by_repo_hash: {
              map: "function(doc) { " +
                "if(! doc.hasOwnProperty('instance_index') || " +
                " (doc.hasOwnProperty('instance_index') && doc.instance_index == '0')) { " +
                "emit([doc.repository_url_hash, doc.repository_url, " +
                "doc.date_received.substring(0, 4), doc.date_received.substring(5, 7), " +
                "doc.date_received.substring(8, 10), doc.space_id, doc.application_version]); } }",
              reduce: "_count",
            },
            by_repo_hash_unique: {
              map: "function(doc) { " +
                "if(! doc.hasOwnProperty('instance_index') || " +
                " (doc.hasOwnProperty('instance_index') && doc.instance_index == '0')) { " +
                "emit([doc.repository_url_hash, doc.repository_url, doc.date_received.substring(0, 4), " +
                "doc.date_received.substring(5, 7), doc.space_id]); } }",
              reduce: "_count",
            },
            apps_by_year_and_month: {
              map: "function(doc) { emit([doc.date_received.substring(0, 4), doc.date_received.substring(5, 7), " +
                "doc.repository_url, doc.space_id, doc.application_version]); }",
              reduce: "_count",
            },
            spaces: {
              map: "function (doc) {emit(doc.space_id, doc); }"
            },
            with_invalid_app_uri_type: {
              map: "function(doc) { if((doc.application_uris) && (! Array.isArray(doc.application_uris))) {" +
                "emit(doc.application_uris); }}",
              reduce: "_count",
            },
          }
        };
        eventsDb.insert(ddoc, function(err) {
          if (!err) {
            console.log("Design document created");
          } else {
            if (409 === err.statusCode) {
              eventsDb.get(ddoc._id, function(err, body) {
                var rev = body._rev;
                delete body._rev;
                var ddocHash = crypto.createHash("md5").update(JSON.stringify(ddoc)).digest("hex");
                var bodyHash = crypto.createHash("md5").update(JSON.stringify(body)).digest("hex");
                if (ddocHash !== bodyHash) {
                  ddoc._rev = rev;
                  eventsDb.insert(ddoc, function(err) {
                    if (!err) {
                      console.log("Design document updated");
                    } else {
                      console.error("Error updating design document database");
                    }
                  });
                } else {
                  console.log("Design document already exists and does not need updating");
                }
              });
            } else {
              console.error("Error creating design document database");
            }
          }
        });
        break;
      case "delete":
        eventsDb.get("_design/deployments", function(err, doc) {
          if (!err) {
            eventsDb.destroy("_design/deployments", doc._rev, function(err) {
              if (!err) {
                console.log("Design document deleted");
              } else {
                if (404 === err.statusCode) {
                  console.log("Design document does not exist");
                } else {
                  console.error("Error deleting design document");
                }
              }
            });
          } else {
            if (404 === err.statusCode) {
              console.log("Design document does not exist");
            } else {
              console.error("Error getting design document");
            }
          }
        });
        break;
    }
  }).on("--help", function() {
    console.log("  Examples:");
    console.log();
    console.log("    $ ddoc put");
    console.log("    $ ddoc delete");
    console.log();
  });

program
  .command("clean <task>")
  .description("Run a data cleanup task")
  .action(function(task) {
    var deploymentTrackerDb = app.get("deployment-tracker-db");
    if (!deploymentTrackerDb) {
      console.error("No database configured");
      return;
    }
    var eventsDb = deploymentTrackerDb.use("events");

    switch (task) {
      case "repository_url_hash":    
        eventsDb.view("deployments", "by_repo_hash", {startkey: [null], endkey: [null, {}, {}, {}, {}, {}, {}],
            reduce: false, include_docs: true}, function(err, body) {
          if(err) {
            console.error("Cleanup task repository_url_hash failed. " +
                          "Invocation of deployments/by_repo_hash returned error: " + err);
          } 
          else {   
            console.log(body.rows.length + " documents without repository URL hashes");
            console.log("Adding repository URL hashes...");
            body.rows.map(function(row) {
              var event = row.doc;
              if (event.repository_url_hash) {
                console.error("Document should not have a repository_url_hash");
                return;
              }
              if (event.repository_url) {
                event.repository_url_hash = crypto.createHash("md5").update(event.repository_url).digest("hex");
                eventsDb.insert(event);
              }
            });
          }
        });
        break;
      case "application_uris_array":
        // Convert application_uris property to array
        eventsDb.view("deployments", "with_invalid_app_uri_type", 
            {reduce: false, include_docs: true}, function(err, body) {
          if(err) {
            console.error("Cleanup task application_uris_array. " +
                          "Invocation of deployments/by_app_uris returned error: " + err);
          } 
          else {   
            console.log(body.rows.length + " documents contain application_uris of invalid type.");
            body.rows.map(function(row) {
              var event = row.doc;
              if((event.application_uris) && (! Array.isArray(event.application_uris))) {
                event.application_uris = [event.application_uris];
                eventsDb.insert(event);
              }
            });
          }
        });
        break; 
    }
  }).on("--help", function() {
    console.log("  Examples:");
    console.log();
    console.log("    $ clean repository_url_hash");
    console.log();
  });

program
  .command("track")
  .description("Track application deployments")
  .action(function() {
    require("cf-deployment-tracker-client").track();
  }).on("--help", function() {
    console.log("  Examples:");
    console.log();
    console.log("    $ track");
    console.log();
  });

program.parse(process.argv);

//-------------------------------------------------------------------------------
// Copyright IBM Corp. 2015
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//-------------------------------------------------------------------------------
