
var vm = require('vm');


var context = {
	get google() {
		return 5 * 2;
	},
	set google(val) {
		console.log(val + 2);
	}
}

var result = vm.runInNewContext('google = 5', context);

console.log(result);