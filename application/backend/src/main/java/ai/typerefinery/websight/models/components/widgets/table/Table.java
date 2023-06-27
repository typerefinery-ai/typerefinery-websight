/*
 * Copyright (C) 2023 Typerefinery.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package ai.typerefinery.websight.models.components.widgets.table;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;
import org.apache.sling.models.annotations.Default;
import org.apache.commons.lang3.StringUtils;
import org.jetbrains.annotations.Nullable;
import ai.typerefinery.websight.models.components.FlowComponent;
import ai.typerefinery.websight.models.components.KeyValuePair;
import ai.typerefinery.websight.services.flow.FlowService;
import ai.typerefinery.websight.services.flow.registry.FlowComponentRegister;
import ai.typerefinery.websight.utils.PageUtil;

import org.osgi.service.component.annotations.Component;
import java.util.HashMap;
import java.util.List;
import javax.inject.Inject;
import javax.inject.Named;

import lombok.Getter;
import javax.annotation.PostConstruct;

@Component
@Model(adaptables = Resource.class, resourceType = {
        "typerefinery/components/widgets/table" }, defaultInjectionStrategy = OPTIONAL)
@Exporter(name = "jackson", extensions = "json", options = {
        @ExporterOption(name = "MapperFeature.SORT_PROPERTIES_ALPHABETICALLY", value = "true"),
        @ExporterOption(name = "SerializationFeature.WRITE_DATES_AS_TIMESTAMPS", value = "false")
})
public class Table extends FlowComponent implements FlowComponentRegister {

    public static final String RESOURCE_TYPE = "typerefinery/components/widgets/table";

    private static final String PROPERTY_DATASOURCE = "dataSource";
    private static final String DEFAULT_DATASOURCE = "";

    private static final String PROPERTY_WEBSOCKET_HOST = "websocketHost";
    private static final String DEFAULT_WEBSOCKET_HOST = "ws://tms.typerefinery.localhost:8100/$tms";

    private static final String PROPERTY_WEBSOCKET_TOPIC = "websocketTopic";
    private static final String DEFAULT_WEBSOCKET_TOPIC = "";

    private static final String PROPERTY_FLOWAPI_TOPIC = "flowapi_topic";
    private static final String DEFAULT_FLOWAPI_TOPIC = "";

    public static final String DEFAULT_FLOWAPI_TEMPLATE = "/apps/typerefinery/components/widgets/table/templates/table.json";
    public static final String DEFAULT_FLOWAPI_SAMPLEDATA = "/apps/typerefinery/components/widgets/table/templates/flowsample.json";

    @Getter
    @Inject
    @Named(PROPERTY_DATASOURCE)
    @Nullable
    public String dataSource;

    @Getter
    @Inject
    @Named(PROPERTY_WEBSOCKET_HOST)
    @Nullable
    public String websocketHost;

    @Getter
    @Inject
    @Named(PROPERTY_WEBSOCKET_TOPIC)
    @Nullable
    public String websocketTopic;

    @Getter
    @Inject
    @Named(PROPERTY_FLOWAPI_TOPIC)
    @Nullable
    public String flowapi_topic;



    @Getter
    @Inject
    public Boolean searchEnabled;     
    
    
    @Getter
    @Inject
    public Boolean paginationEnabled;
    
    @Getter
    @Inject
    public Boolean resizableEnabled;

    
    @Getter
    @Inject
    public Boolean multipleSelectRowEnabled;

    
    // key is topic and value is type = HIGHLIGHT || FILTER
    @Getter
    @Inject
    public List<KeyValuePair> events;


    @Getter
    @Inject
    public Boolean singleSelectEnabled;



    @Getter
    @Inject
    public Boolean showActionButtons;

    
    @Getter
    @Inject
    public List<ActionButton> actionButtons;

    @Getter
    @Inject
    public List<ColumnRules> columnRules;

    @Getter
    @Inject
    public List<Column> columns;


    @Getter
    @Inject
    @Default(booleanValues = true)
    public Boolean overRideColumns;

    
    /**
     * The unique id column.
     */
    @Getter
    @Inject
    @Default(values = "name")
    public String uniqueIdColumn;

    @Override
    @PostConstruct
    protected void init() {

        super.init();
        if (StringUtils.isBlank(dataSource)) {
            this.dataSource = DEFAULT_DATASOURCE;
        }
        if (StringUtils.isBlank(websocketHost)) {
            this.websocketHost = DEFAULT_WEBSOCKET_HOST;
        }
        if (StringUtils.isBlank(websocketTopic)) {
            this.websocketTopic = DEFAULT_WEBSOCKET_TOPIC;
        }
        if (StringUtils.isBlank(flowapi_topic)) {
            this.flowapi_topic = DEFAULT_FLOWAPI_TOPIC;
        }
        if (StringUtils.isBlank(this.websocketTopic)) {
            this.websocketTopic = this.flowapi_topic;
        }
        // default values to be saved to resource if any are missing
        HashMap<String, Object> props = new HashMap<String, Object>(){{}};
        
        if (StringUtils.isBlank(this.flowapi_template)) {
            this.flowapi_template = DEFAULT_FLOWAPI_TEMPLATE;
            props.put(FlowService.prop(FlowService.PROPERTY_TEMPLATE), this.flowapi_template);
        }
        if (StringUtils.isBlank(this.flowapi_sampledata)) {
            this.flowapi_sampledata = DEFAULT_FLOWAPI_SAMPLEDATA;
            props.put(FlowService.prop(FlowService.PROPERTY_SAMPLEDATA), this.flowapi_sampledata);
        }
        if (StringUtils.isBlank(this.websocketTopic)) {
            this.websocketTopic = this.flowapi_topic;
        }
        props.put("overRideColumns", this.overRideColumns);
        
        if (props.size() > 0) {
            //update any defaults that should be set
            PageUtil.updatResourceProperties(resource, props);
        }

    }

    @Override
    public String getKey() {
        return FlowService.FLOW_SPI_KEY;
    }

    @Override
    public String getComponent() {
        return RESOURCE_TYPE;
    }

    @Override
    public int getRanking() {
        return 200;
    }
}
