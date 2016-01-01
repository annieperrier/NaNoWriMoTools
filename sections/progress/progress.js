var progress = angular.module('progress', []);

progress.controller('ProgressCtrl', ['$scope', '$stateParams', 'CONFIG', 'Progress', 
	function ($scope, $stateParams, CONFIG, Progress) {

		var buildDate = function()
		{
			return $scope.curyear.year + '-' + $scope.today.month + '-' + $scope.today.day;
		}
		var origdate = null;

		$scope.words = 0;

		$scope.$watch('curyear', function() {
			if (!$scope.curyear)
				return;
			//console.log($scope.curyear.year);
			origdate = buildDate();
			$scope.date = origdate;
			$scope.getProgress($scope.curyear.year);
			// if user didn't change date, set year to selected
			if (origdate == $scope.date)
				$scope.date = buildDate();
		});


		$scope.getProgress = function(year)
		{
			Progress.getProgress(year).then(function(data)
			{
				//console.log('Drawing data for year: '+year);
				//console.log(data);
				$scope.progressData = data;
			});
		};

		$scope.deleteProgress = function()
		{
			//console.log('Delete date: ', $scope.deletedate.date);
			Progress.deleteProgress($scope.deletedate.date);
		};

		$scope.saveQuickProgress = function()
		{
			// force the date to today
			if (!$scope.quickwords || $scope.quickwords < 0)
			{
				//console.log('invalid data');
				return false;
			}
			Progress.saveProgress(origdate, $scope.quickwords);
			$scope.quickwords = null;
		};

		$scope.saveProgress = function()
		{
			//console.log($scope.date);
			//console.log($scope.words);
			if (!$scope.date || !$scope.words || $scope.words < 0)
			{
				//console.log('invalid data');
				return false;
			}
			Progress.saveProgress($scope.date, $scope.words);
			$scope.words = null;
		};
}]);
progress.factory('Progress', ['CONFIG', '$firebase', '$q',
	function(CONFIG, $firebase, $q){
		var dataFactory = {};

		var progress = null;
		
		dataFactory.getProgress = function(year)
		{
			var deferred = $q.defer();

			var dRef = new Firebase(CONFIG.BASE_URL+"/progress/"+year);
			var sync = $firebase(dRef);

			progress = sync.$asArray();
			progress.$loaded().then(function() {
				//console.log(progress);
				deferred.resolve(progress);
			});

			return deferred.promise;
		}

		dataFactory.saveProgress = function(date, words)
		{
			// are we adding or editing?
			var found = false;
			angular.forEach(progress, function(i, key) {
				if (date == progress[key].date)
				{
					found = true;
					//console.log("Found, doing edit.");
					var item = progress.$getRecord( progress[key].$id );
					item.words = words;
					progress.$save(item);
				}
			});
			if (!found)
				progress.$add({date: date, words: words});
		};

		dataFactory.deleteProgress = function(date)
		{
			// find record
			var found = false;
			angular.forEach(progress, function(i, key) {
				if (date == progress[key].date)
				{
					found = true;
					//console.log("Found, doing remove.");
					var item = progress.$getRecord( progress[key].$id );
					progress.$remove(item);
					return true;
				}
			});
			if (!found)
				return false;
		};

		return dataFactory;
}]);

progress.directive('chartBar', ['$parse',
	function ($parse) {

	//explicitly creating a directive definition variable
	//this may look verbose but is good for clarification purposes
	//in real life you'd want to simply return the object {...}
	var directiveDefinitionObject = {
		//We restrict its use to an element
		//as usually  <bars-chart> is semantically
		//more understandable
		restrict: 'E',
		//this is important,
		//we don't want to overwrite our directive declaration
		//in the HTML mark-up
		replace: false,
		template: '<div id="chart"></div>',
		//our data source would be an array
		//passed thru chart-data attribute
		scope: {data: '=chartData'},
		link: function (scope, element, attrs) {
			scope.$watch('data', function(newval, oldval){
//				console.log('watch seen');
				if (newval)
				{
//					console.log('watch new');
					scope.drawChart(scope.data);
				}
			}, true);

			scope.drawChart = function(data)
			{
				if (!data)
				{
					//console.log("No data for graph yet.");
					return false;
				}
				// sort the data by date
				data.sort(function(a,b) {
					var aa = new Date(a.date);
					var bb = new Date(b.date);
					//console.log(aa, bb);
					return aa>bb ? 1 : aa<bb ? -1 : 0;
				});
				scope.data = data;

				scope.cnt = scope.data.length;

				var	margin = {top: 20, right: 20, bottom: 100, left: 80},
					maxcolwidth = 14,
					width = (scope.cnt * maxcolwidth) + 100 - margin.left - margin.right,
					height = 400 - margin.top - margin.bottom,
					maxwords = 60000;

				var x = d3.scale.ordinal().rangeRoundBands([0, width], .2);
				var y = d3.scale.linear().range([height, 0]);

				var xAxis = scope.make_x_axis(x);
				var yAxis = scope.make_y_axis(y);

				// setup the basic chart
				var svg = d3.select("#chart").html('').append("svg")
					.attr("width", width + margin.left + margin.right)
					.attr("height", height + margin.top + margin.bottom)
					.append("g")
						.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

				x.domain(data.map(function(d) { return d.date; }));
				y.domain([0, maxwords]);

				// horizontal scale
				var xaxisg = svg.append("g")
					.attr("class", "x axis")
					.attr("transform", "translate(0," + height + ")")
					.call(xAxis);
				xaxisg.selectAll("text")
						.style("text-anchor", "end")
						.attr("dx", "-.8em")
						.attr("dy", ".15em")
						.attr("transform", function(d) { return "rotate(-55)" });
				xaxisg.append("text")
						.attr("x", width/2)
						.attr("y", 80)
						.attr("class", "x_axis_label")
						.text("Days");

				// vertical scale
				svg.append("g")
					.attr("class", "y axis")
					.call(yAxis)
					.append("text")
						.attr("transform", "rotate(-90)")
						.attr("y", -55)
						.attr("x", -height/2)
						.attr("class", "y_axis_label")
						.text("Words");

				// add horizontal grid, needs to be before bar to be behind
				svg.append("g")
					.attr("class", "grid")
					.call(yAxis
						.tickSize(-width, 0, 0)
						.tickFormat("")
					);

				// iterate through the data
				var bar = svg.selectAll(".bar").data(data).enter();


				var barg = bar.append("g")
					.attr("class", "bar_group");

				barg.append("rect")
					.attr("class", "bar")
					.attr("x", function(d) { return x(d.date); })
					.attr("width", x.rangeBand())
					.attr("y", function(d) { return y(d.words); })
					.attr("height", function(d) { return height - y(d.words); });

				barg.append("text")
					.attr("class", "bartext")
					.attr("x", function(d) { return x(d.date) + (x.rangeBand()/2); })
					.attr("y", function(d) { return y(d.words) - 5; })
					.attr("transform", function(d) { return "rotate(-55 "+(x(d.date) + (x.rangeBand()/2))+" "+(y(d.words)-5)+")"; })
					.text(function(d) { return d.words; });
			}

			scope.make_x_axis = function(x) {
				return d3.svg.axis()
					.scale(x)
					.orient("bottom");
			};

			scope.make_y_axis = function(y) {
				return d3.svg.axis()
					.scale(y)
					.orient("left")
					.ticks(10);
			};
		}
	};

	return directiveDefinitionObject;
}]);