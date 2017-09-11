var Analytics = require('analytics-node');
var analytics = new Analytics(process.env.WRITE_KEY);


module.exports = {
	sentAnalytic: function(data){
		sentData(data);
	}
};

function sentData(data){
  analytics.track({
    userId: '76543456',
    event: 'Created Project',
    properties: data
  });
 }