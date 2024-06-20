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
package ai.typerefinery.websight.models.components.forms;
import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;
import org.apache.sling.models.annotations.Model;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import lombok.Getter;

import ai.typerefinery.websight.models.components.BaseFormComponent;

@Model(adaptables = {
    Resource.class,
    SlingHttpServletRequest.class
}, defaultInjectionStrategy = OPTIONAL)
@Exporter(name = "jackson", extensions = "json", options = {
    @ExporterOption(name = "SerializationFeature.WRITE_DATES_AS_TIMESTAMPS", value = "true")
})
public class Composite extends BaseFormComponent {

    protected static final String DEFAULT_LABEL = "Composite";
    protected static final String DEFAULT_ID = "composite";
    protected static final String DEFAULT_MODULE = "composite";
    protected static final String DEFAULT_SELECT_CLASSES = "form-composite mt-1";

    @Inject
    @Getter
    public String inputType;

    @Inject
    @Getter
    public Boolean listIsUserReadonly;

    @Override
    @PostConstruct
    protected void init() {
        this.module = DEFAULT_MODULE;
        super.init();

        if (StringUtils.isBlank(label)) {
            this.label = DEFAULT_LABEL;
        }

        style.addClasses(DEFAULT_SELECT_CLASSES);
        
    }  
    
}