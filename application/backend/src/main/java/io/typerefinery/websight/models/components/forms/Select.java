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

import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Model;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import org.apache.sling.models.annotations.Default;
import lombok.Getter;

import io.typerefinery.websight.models.components.BaseFormComponent;

@Model(adaptables = Resource.class, defaultInjectionStrategy = OPTIONAL)
public class Select extends BaseFormComponent {

    protected static final String DEFAULT_LABEL = "Select";
    protected static final String DEFAULT_ID = "select";
    protected static final String DEFAULT_MODULE = "select";
    protected static final String DEFAULT_SELECT_CLASSES = "form-select mt-1";
    protected static final String DEFAULT_PLACEHOLDER = "Select an item";

    @Inject
    @Getter
    @Default(values = "Select the data")
    private String placeholder;

    @Inject
    @Getter
    private List<SelectOptionItems> selectOptions;

    @Override
    @PostConstruct
    protected void init() {
        this.id = DEFAULT_ID;
        this.module = DEFAULT_MODULE;
        super.init();

        if (StringUtils.isBlank(label)) {
            label = DEFAULT_LABEL;
        }

        if (StringUtils.isBlank(placeholder)) {
            placeholder = DEFAULT_PLACEHOLDER;
        }

        if (style != null) {
            style.addClasses(DEFAULT_SELECT_CLASSES);
        }
        
    }  
    
}