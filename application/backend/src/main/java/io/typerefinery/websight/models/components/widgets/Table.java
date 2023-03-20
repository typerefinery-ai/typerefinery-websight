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
package io.typerefinery.websight.models.components.widgets;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import java.util.List;

import org.apache.sling.models.annotations.Model;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;
import org.apache.sling.models.annotations.Default;

import javax.inject.Inject;
import lombok.Getter;
import javax.annotation.PostConstruct;

import io.typerefinery.websight.models.components.BaseComponent;

@Model(adaptables = Resource.class, resourceType = {
        "typerefinery/components/widgets/table" }, defaultInjectionStrategy = OPTIONAL)
@Exporter(name = "jackson", extensions = "json", options = {
        @ExporterOption(name = "MapperFeature.SORT_PROPERTIES_ALPHABETICALLY", value = "true"),
        @ExporterOption(name = "SerializationFeature.WRITE_DATES_AS_TIMESTAMPS", value = "false")
})
public class Table extends BaseComponent {


    @Getter
    @Inject
    public String dataSource;

    @Getter
    @Inject
    @Default(values = "ws://localhost:8112/$tms")
    public String websocketHost;

    @Getter
    @Inject
    public String websocketTopic;


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
    }
}
