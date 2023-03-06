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
package io.typerefinery.websight.models.components.forms;
import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import java.util.HashMap;

import javax.inject.Inject;
import lombok.Getter;

import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;
import org.apache.sling.models.annotations.Model;
import org.osgi.service.component.annotations.Component;

import javax.annotation.PostConstruct;

import io.typerefinery.websight.models.components.BaseFormComponent;
import io.typerefinery.websight.models.components.FlowComponent;
import io.typerefinery.websight.models.components.flow.FlowContainer;
import io.typerefinery.websight.services.flow.FlowService;
import io.typerefinery.websight.services.flow.registry.FlowComponentRegister;
import io.typerefinery.websight.utils.PageUtil;

@Component
@Model(adaptables = {
    Resource.class,
    SlingHttpServletRequest.class
    },
    resourceType = { Form.RESOURCE_TYPE }, 
    defaultInjectionStrategy = OPTIONAL
)
@Exporter(name = "jackson", extensions = "json", options = {
    @ExporterOption(name = "SerializationFeature.WRITE_DATES_AS_TIMESTAMPS", value = "true")
})
public class Form extends FlowComponent implements FlowComponentRegister {

    public static final String RESOURCE_TYPE = "typerefinery/components/forms/form";

    public static final String DEFAULT_FLOWAPI_TEMPLATE = "/apps/typerefinery/components/forms/form/templates/flowform-service.json";
    public static final String DEFAULT_FLOWAPI_SAMPLEDATA = "/apps/typerefinery/components/forms/form/templates/flowsample.json";
    
    private String DEFAULT_FORM_CLASSES = "card p-4 mb-3";

    @Inject
    @Getter
    private String writeUrl;

    @Inject
    @Getter
    private String writePayloadType;


    @Inject
    @Getter
    private String writeMethod;

    @Inject
    @Getter
    private String readUrl;

    @Inject
    @Getter
    private String readPayloadType;


    @Inject
    @Getter
    private String readMethod;

    private static final String DEFAULT_ID = "form";
    private static final String DEFAULT_MODULE = "formComponent";

    @Override
    @PostConstruct
    protected void init() {
        this.module = DEFAULT_MODULE;
        super.init();

        grid.addClasses(DEFAULT_FORM_CLASSES);

        // default values to be saved to resource if any are missing
        HashMap<String, Object> props = new HashMap<String, Object>(){{            
        }};

        if (StringUtils.isBlank(readUrl)) {
            readUrl = this.flowapi_httproute;
            props.put("readUrl", this.readUrl);
        }
        if (StringUtils.isBlank(writeUrl)) {
            writeUrl = this.flowapi_httproute;
            props.put("writeUrl", this.writeUrl);
        }
        if (StringUtils.isBlank(title)) {
            title = this.flowapi_title;
            props.put("title", this.title);
        }

        if (StringUtils.isBlank(this.flowapi_template)) {
            this.flowapi_template = DEFAULT_FLOWAPI_TEMPLATE;
            props.put(FlowService.prop(FlowService.PROPERTY_TEMPLATE), this.flowapi_template);
        }
        if (StringUtils.isBlank(this.flowapi_sampledata)) {
            this.flowapi_sampledata = DEFAULT_FLOWAPI_SAMPLEDATA;
            props.put(FlowService.prop(FlowService.PROPERTY_SAMPLEDATA), this.flowapi_sampledata);
        }

        //update any defaults that should be set
        PageUtil.updatResourceProperties(resource, props);
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