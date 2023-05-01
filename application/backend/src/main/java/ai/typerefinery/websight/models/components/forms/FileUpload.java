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
//namespace
package ai.typerefinery.websight.models.components.forms;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Model;

import ai.typerefinery.websight.models.components.BaseFormComponent;
import ai.typerefinery.websight.models.components.KeyValuePair;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import lombok.Getter;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;

import org.apache.sling.api.SlingHttpServletRequest;

@Model(adaptables = {
    Resource.class,
    SlingHttpServletRequest.class
}, defaultInjectionStrategy = OPTIONAL)
@Exporter(name = "jackson", extensions = "json", options = {
    @ExporterOption(name = "SerializationFeature.WRITE_DATES_AS_TIMESTAMPS", value = "true")
})
public class FileUpload extends BaseFormComponent {

    protected static final String DEFAULT_ID = "input";
    protected static final String DEFAULT_MODULE = "input";
    protected static final String DEFAULT_LABEL = "Full Name";
    protected static final String DEFAULT_PLACEHOLDER = "Type here.";

    @Inject
    @Getter
    @Default(values = "")
    public String placeholder;

    @Inject
    @Getter
    @Default(values = "text")
    public String inputType;

    
    @Inject
    @Getter
    @Default(values = "")
    public String variant;

    @Inject
    @Getter
    @Default(booleanValues = false)
    public Boolean validationRequired;

    
    @Inject
    @Getter
    @Default(booleanValues = false)
    public Boolean multiple;

    // @Inject
    // @Getter
    // public List<KeyValuePair> acceptFileTypes;

    @Inject
    @Getter
    @Default(values = "*")
    public String accept;
    

    @Override
    @PostConstruct
    protected void init() {
        this.module = DEFAULT_MODULE;
        super.init();

        if (StringUtils.isBlank(label)) {
            label = DEFAULT_LABEL;
        }

        if (StringUtils.isBlank(placeholder)) {
            placeholder = DEFAULT_PLACEHOLDER;
        }

        style.addClasses("form-control mt-1");
    }

}