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

import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Model;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;

import lombok.Getter;

import ai.typerefinery.websight.models.components.BaseFormComponent;

@Model(adaptables = {
    Resource.class,
    SlingHttpServletRequest.class
}, defaultInjectionStrategy = OPTIONAL)
@Exporter(name = "jackson", extensions = "json", options = {
    @ExporterOption(name = "SerializationFeature.WRITE_DATES_AS_TIMESTAMPS", value = "true")
})
public class Select extends BaseFormComponent {

    protected static final String DEFAULT_LABEL = "Select";
    protected static final String DEFAULT_ID = "select";
    protected static final String DEFAULT_MODULE = "select";
    protected static final String DEFAULT_SELECT_CLASSES = "form-select mt-1";
    protected static final String DEFAULT_PLACEHOLDER = "Select an item";

    @Inject
    @Getter
    public String inputType;

    @Inject
    @Getter
    @Default(booleanValues = false)
    public Boolean validationRequired;

    @Inject
    @Getter
    public List<SelectOptionItems> selectOptions;
    
    @Getter
    @Inject
    public Boolean multipleSelection;

    @Getter
    @Inject
    public String maxSelection;


    @Getter
    @Inject
    public Boolean enableSearch;

    @Getter
    @Inject
    public String searchPlaceholder;
    
    @Getter
    @Inject
    public Boolean enableSelectAll;

    @Getter
    @Inject
    public String defaultSelectedOptions;

    @Getter
    @Inject
    public String readOptionsFromDataSource;
    
    @Getter
    @Inject
    public String readMethod;

    
    @Getter
    @Inject
    public String readPayloadType;

    @Getter
    @Inject 
    public String keyNameInOptionList;

    
    @Getter
    @Inject 
    public String labelNameInOptionList;

    


    @Getter
    @Inject
    public List<SelectOptionItems> options;

    @Override
    @PostConstruct
    protected void init() {
        this.module = DEFAULT_MODULE;
        super.init();

        if (StringUtils.isBlank(label)) {
            this.label = DEFAULT_LABEL;
        }

        if (StringUtils.isBlank(placeholder)) {
            this.placeholder = DEFAULT_PLACEHOLDER;
        }

        style.addClasses(DEFAULT_SELECT_CLASSES);
        
    }  
    
}