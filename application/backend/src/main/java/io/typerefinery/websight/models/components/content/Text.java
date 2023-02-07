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

package io.typerefinery.websight.models.components.content;

import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Model;

import io.typerefinery.websight.models.components.BaseComponent;
import lombok.Getter;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import java.util.HashMap;
import java.util.Map;

import javax.annotation.PostConstruct;
import javax.inject.Inject;

@Model(adaptables = Resource.class, defaultInjectionStrategy = OPTIONAL)
public class Text extends BaseComponent {

    @Getter
    @Inject
    @Default(values = "Rich Text")
    private String text;
    
    @Getter
    @Inject
    @Default(values = "")
    private String theme;
    
    private Map<String, String> themeConfig = new HashMap<String, String>(){{
        put("checked", "hl-rich-text--checked-bullet-points");
    }};

    @Override
    @PostConstruct
    protected void init() {
        super.init();

        if (StringUtils.isNotBlank(theme)) {
            theme = themeConfig.getOrDefault(theme, "");
        }
    }


}