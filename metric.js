var Analytics = require('analytics-node');
var analytics = new Analytics(process.env.WRITE_KEY);
module.exports = {
	sentAnalytic: function(data,config,provider){
		var newData = massage(data,config,provider);
		sentData(newData);
		return newData;
	},
	listTop9Services: function(services, serviceCount){
		return top9Services(services, serviceCount);
	}
};

function massage(data,config,provider){
	//rename entries to our segment format
	var newData = {
		repository_id : '',
		target_runtimes : '',
		target_services : '',
		event_id : '',
		date_deployed : '',
		event_organizer: ''
	};
	newData.cfMetric = JSON.parse(JSON.stringify(data));
	try{
		if(config){
			if(config.repository_id) newData.repository_id = config.repository_id;
			if(config.target_runtimes) newData.target_runtimes = config.target_runtimes;
			if(config.target_services) newData.target_services = config.target_services;
			if(config.event_id) newData.event_id = config.event_id;
			if(config.event_organizer) newData.event_organizer = config.event_organizer;
			if(provider) newData.provider = provider;
			if(newData.cfMetric.config) delete newData.cfMetric.config;
		}
		if(data.date_sent) newData.date_deployed = data.date_sent;
	}catch(ex){
		console.log("repository.yaml is not parsed or causing error");
	}
	return newData;
}

//Sent data to Segment
function sentData(data){
  var id = 'unknownID';
  if(data.cfMetric.space_id) id = data.cfMetric.space_id;
  analytics.track({
    userId: id,
    event: 'Created Project',
    properties: data
  });
 }

 function top9Services(services, serviceCount){
	try{
		services.sort(function(a, b) {
		  if (a.value < b.value) {
		    return -1;
		  }
		  if (a.value > b.value) {
		    return 1;
		  }
		  return 0;
		}).reverse();
		var top9Count = 0;
		var temp = [];
		for(var i = 0; i < 9; i++){
		  top9Count+= services[i].value;
		  temp.push(services[i]);
		}
		var others = {
		      key: "Others",
		      value: serviceCount - top9Count
		    };
		temp.push(others);
		services = temp;
		return services;
	}catch(ex){
		//Error on the service attribute or not enough services.
		return services;
	}

 }