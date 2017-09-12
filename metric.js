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
	var newData = {}
	newData.cfMetric = data
	newData.repository_id = config.repository_id
	newData.target_runtimes = config.target_runtimes
	newData.target_services = config.target_services
	newData.event_id = config.event_id
	newData.deploy_to_bluemix = config.deploy_to_bluemix

	return newData;
}


function sentData(data){
  analytics.track({
    userId: '76543456',
    event: 'Created Project',
    properties: data
  });
 }