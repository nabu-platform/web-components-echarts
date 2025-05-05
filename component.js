Vue.view("echarts-graph", {
	props: {
		page: {
			type: Object,
			required: true
		},
		parameters: {
			type: Object,
			required: false
		},
		childComponents: {
			type: Object,
			required: false
		},
		cell: {
			type: Object,
			required: true
		},
		edit: {
			type: Boolean,
			required: true
		}
	},
	data: function() {
		return {
			chart: null
		}
	},
	ready: function() {
		setTimeout(this.draw, 100);
		var self = this;
		this.watchers = this.$services.data.watchAll({target:this.cell.state, page: this.page, handler: function() {
			self.draw();
		}});
	},
	beforeDestroy: function() {
		console.log("destroying watchers", this.watchers);
		this.$services.data.unwatchAll(this.watchers);
	},
	methods: {
		configurator: function() {
			return "echarts-graph-configure";
		},
		getChildComponents: function() {
			return [{
				title: "Graph",
				name: "page-echarts-graph",
				component: "echarts-graph"
			}];
		},
		format: function(value, format) {
			var self = this;
			if (format != null && Object.keys(format).length) {
				var updateFunction = function() {
					// do nothing
				}
				var component = Vue.component("page-formatted");
				var formatted = new component({propsData: {
					page: self.page,
					cell: {state: format},
					value: value,
					fragment: format,
					updater: updateFunction,
					// we might need it
					allowDataAttributes: true,
					allowLinkIds: true
				}, updated: updateFunction, ready: updateFunction, watch: {
					formatted: function(newValue) {
						// no support (currently) for asynchronous?
						// updateContent(newValue);
						console.log("Updated formatted", newValue);
					}
				}, methods: {
					$value: self.$value
				}});
				formatted.$mount();
				return formatted.$el.innerHTML;
			}
			else {
				return value;
			}
		},
		draw: function() {
			if (!this.chart) {
				this.chart = echarts.init(this.$el);
			}
			var option = {};
			option.tooltip = {
				//trigger: 'item'
				trigger: 'axis'
//				axisPointer: { type: 'cross' }
			};
		
			// does not work
		/*	
			option.legend = {
				// Try 'horizontal'
				orient: 'vertical',
				right: 10,
				top: 'center',
				show: true
			};
			
			maybe need this
			legend: {
    data: ['Step Start', 'Step Middle', 'Step End']
  },
		*/
			
			option.xAxis = {
				type: 'category',
				data: []
			};
			option.yAxis = {
				type: 'value'
			};

			// Add min and max values to yAxis if configured
			if (this.cell.state.yAxisMin != null) {
				option.yAxis.min = Number(this.$services.page.interpret(this.cell.state.yAxisMin, this));
			}
			if (this.cell.state.yAxisMax != null) {
				option.yAxis.max = Number(this.$services.page.interpret(this.cell.state.yAxisMax, this));
			}

			option.series = [];
			
			option.grid = {
				left: this.cell.state.gridLeft == null ? '15%' : this.cell.state.gridLeft + '%',
				right: this.cell.state.gridRight == null ? '5%' : this.cell.state.gridRight + '%',
				top: this.cell.state.gridTop == null ? '5%' : this.cell.state.gridTop + '%',
				bottom: this.cell.state.gridBottom == null ? '15%' : this.cell.state.gridBottom + '%'
			}
			
			var self = this;
			var promises = [];
			if (this.cell.state.pipelines) {
				nabu.utils.arrays.merge(promises, this.cell.state.pipelines.map(function(pipeline) {
					var promise = self.$services.data.load({target:pipeline, page: self.page, instance: self});
					promise.then(function(result) {
						var data = result.records;
						
						// calculate labels
						var labels = [];
						var labeler = function(record) {
							return {
								value: record ? self.format(record[pipeline.labelField], pipeline.labelFormat) : null
							};
						};
						if (pipeline.labelField) {
							labels = self.$services.data.calculateLabelSeries(data, labeler);
						}
						else {
							// TODO: use script
						}
						labels.forEach(function(x) {
							if (option.xAxis.data.indexOf(x) < 0) {
								option.xAxis.data.push(x);
							}
						});
						
						var pushSeries = function(series, endLabel) {
							// calculate data series
							var values = [];
							if (pipeline.valueField) {
								values = series.map(function(record) {
									return record ? self.format(record[pipeline.valueField], pipeline.valueFormat) : null;
								});
							}
							else {
								// TODO: use script
							}
							var result = {
								data: values,
								type: pipeline.graphType ? pipeline.graphType : "line",
								connectNulls: pipeline.connectNulls
							};
							if (endLabel) {
								result.endLabel = {
									show: true,
									formatter: function (params) {
										return endLabel;
									}
								};
								result.labelLayout = {
									moveOverlap: 'shiftY'
								};
							}
							option.series.push(result);
						}
						
						if (pipeline.groupByField) {
							var matrix = self.$services.data.group(data, function(record) {
								return record[pipeline.groupByField];
							});
							var matrixLabels = Object.keys(matrix);
							matrix = self.$services.data.normalizeMatrix(Object.values(matrix), labeler, labels);
							matrix.forEach(function(series, index) {
								pushSeries(series, matrixLabels[index]);
							});
						}
						else {
							// normalize series to x-axis
							data = self.$services.data.normalizeSeries(data, labeler, labels);
							
							pushSeries(data);
						}
					});
					return promise;
				}));
			}
			this.$services.q.all(promises).then(function() {
				// at this particular point we want to fully redraw the chart
				// we can throw away series etc
				// when we append data we don't want the second parameter, then the library will perform cool automerges
				self.chart.setOption(option, true);
			});
		}
	},
	watch: {
		parameters: {
			handler: function() {
				this.draw();
			},
			deep: true
		}
	}
});

Vue.component("echarts-graph-configure", {
	template: "#echarts-graph-configure",
	props: {
		page: {
			type: Object,
			required: true
		},
		cell: {
			type: Object,
			required: true
		},
		edit: {
			type: Boolean,
			required: true
		}
	},
	created: function() {
		if (this.cell.state.gridTop == null) {
			this.cell.state.gridTop = 5;
		}
		if (this.cell.state.gridRight == null) {
			this.cell.state.gridRight = 5;
		}
		if (this.cell.state.gridBottom == null) {
			this.cell.state.gridBottom = 15;	
		}
		if (this.cell.state.gridLeft == null) {
			this.cell.state.gridLeft = 15;
		}
	},
	methods: {
		initializePipeline: function(pipeline) {
			pipeline.labelFormat = {};
			pipeline.valueFormat = {};
		},
		initializeObject: function(parent, name) {
			if (!parent[name]) {
				Vue.set(parent, name, {});
			}
		}
	}
});