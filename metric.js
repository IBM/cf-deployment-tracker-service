var Analytics = require('analytics-node');
var analytics = new Analytics(process.env.WRITE_KEY);


module.exports = {
	sentAnalytic: function(data,config){
		var newData = massage(data,config);
		sentData(newData);
		return newData;
	}
};

function massage(data,config){
	//rename entries to our segment format
	var newData = {};
	newData.cfMetric = data;
	try{
	if(config.repository_id) newData.repository_id = config.repository_id; else newData.repository_id = "";
	if(config.target_runtimes) newData.target_runtimes = config.target_runtimes; else newData.target_runtimes = "";
	if(config.target_services) newData.target_services = config.target_services; else newData.target_services = "";
	if(config.event_id) newData.event_id = config.event_id; else newData.event_id = "";
	if(config.deploy_to_bluemix) newData.deploy_to_bluemix = config.deploy_to_bluemix; else newData.deploy_to_bluemix = "";
	}catch(ex){
		console.log("repository.config is not parsed or causing error");
	}
	return newData;
}

//Sent data to Segment
function sentData(data){
  analytics.track({
    userId: '012012012',
    event: 'Created Project',
    properties: data
  });
 }