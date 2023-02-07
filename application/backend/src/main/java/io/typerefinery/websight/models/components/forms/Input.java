/*
 * Copyright (C) 2022 Typerefinery.io
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
package io.typerefinery.websight.models.components.forms;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Model;

import io.typerefinery.websight.models.components.BaseFormComponent;
import io.typerefinery.websight.utils.GridDisplayType;
import io.typerefinery.websight.utils.GridStyle;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import lombok.Getter;
import org.apache.sling.models.annotations.Default;
@Model(adaptables = Resource.class, defaultInjectionStrategy = OPTIONAL)
public class Input extends BaseFormComponent {

    protected static final String DEFAULT_LABEL = "Input Text";
    protected static final String DEFAULT_PLACEHOLDER = "Enter Text";

    @Inject
    @Getter
    @Default(values = "")
    private String placeholder;

    @Inject
    @Getter
    @Default(values = "text")
    private String inputType;

    @Inject
    @Getter
    @Default(values = "")
    private String inputSize;
    
    private Map<String, String> inputSizeConfig = new HashMap<String, String>(){{
        put("small", "p-inputtext-s");
        put("normal", "");
        put("large", "p-inputtext-m");
    }};

    @Override
    @PostConstruct
    protected void init() {
        super.init();

        if (StringUtils.isNotBlank(inputSize)) {
            inputSize = inputSizeConfig.getOrDefault(inputSize, "");
        }

        if (StringUtils.isBlank(label)) {
            label = DEFAULT_LABEL;
        }

        if (StringUtils.isBlank(placeholder)) {
            placeholder = DEFAULT_PLACEHOLDER;
        }

        
        if (grid != null && style != null) {
            style.addClasses(inputSize);
            
            componentClasses = Stream.concat(
                Arrays.stream(style.getClasses()),
                new GridStyle(grid, GridDisplayType.GRID).getClasses().stream())
            .collect(Collectors.toCollection(LinkedHashSet::new))
            .toArray(new String[]{});
        }


    }

}