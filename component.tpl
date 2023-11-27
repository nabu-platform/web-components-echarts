<template id="echarts-graph">
	<div class="echarts-graph" :class="getChildComponentClasses('page-echarts-graph')">
	</div>
</template>

<template id="echarts-graph-configure">
	<div>
		<data-pipelines-configure :target="cell.state" :page="page" :initializer="initializePipeline">
			<template v-slot:pipeline="props">
				<n-form-combo v-model="props.pipeline.graphType" label="Graph type" :items="['line', 'bar']"/>
				<n-form-switch v-if="props.pipeline.graphType == 'line'" v-model="props.pipeline.connectNulls" label="Connect null values"/>
				
				<n-form-combo v-model="props.pipeline.labelField" label="Label field" v-if="!props.pipeline.labelCalculator"
					:filter="$services.data.filterFields.bind($self, {target: props.pipeline, page:page})"/>
				<n-form-ace v-model="props.pipeline.labelCalculator" label="Label calculator" v-if="!props.pipeline.labelField"/>
				
				<page-formatted-configure v-if="props.pipeline.labelField && props.pipeline.labelFormat" :page="page" :cell="cell" 
					:fragment="props.pipeline.labelFormat" 
					:allow-html="true"/>
				
				<n-form-combo v-model="props.pipeline.valueField" label="Value field" v-if="!props.pipeline.valueCalculator"
					:filter="$services.data.filterFields.bind($self, {target: props.pipeline, page:page})"/>
				<n-form-ace v-model="props.pipeline.valueCalculator" label="Value calculator" v-if="!props.pipeline.valueField"/>
				<page-formatted-configure v-if="props.pipeline.valueField && props.pipeline.valueFormat" :page="page" :cell="cell" 
					:fragment="props.pipeline.valueFormat" 
					:allow-html="true"/>
				
				<n-form-combo v-model="props.pipeline.groupByField" label="Group by field" after="Generates a matrix of series"
					:filter="$services.data.filterFields.bind($self, {target: props.pipeline, page:page})"/>
					
			</template>
		</data-pipelines-configure>
		<h2 class="section-title">Grid offset</h2>
		<n-form-text v-model="cell.state.gridTop" type="range" :minimum="0" :maximum="100" label="Grid top"/>
		<n-form-text v-model="cell.state.gridRight" type="range" :minimum="0" :maximum="100" label="Grid right"/>
		<n-form-text v-model="cell.state.gridBottom" type="range" :minimum="0" :maximum="100" label="Grid bottom"/>
		<n-form-text v-model="cell.state.gridLeft" type="range" :minimum="0" :maximum="100" label="Grid left"/>
	</div>
</template>