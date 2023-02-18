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

package io.typerefinery.websight.models.components.content;

import lombok.Getter;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Model;

import io.typerefinery.websight.models.components.BaseComponent;
import io.typerefinery.websight.models.components.layout.Grid;
import io.typerefinery.websight.models.components.layout.Styled;

import javax.inject.Inject;

import java.util.HashMap;
import java.util.Map;

import javax.annotation.PostConstruct;

@Model(adaptables = Resource.class)
public class Title extends BaseComponent implements Styled, Grid {

    @Inject
    @Getter
    @Default(values = "Add your heading here")
    private String title;

    @Inject
    @Getter
    @Default(values = "2")
    private String headingLevel;

    @Inject
    @Getter
    @Default(values = "4")
    private String headingSize;


    @Inject
    @Getter
    @Default(values = "center")
    private String textAlignment;

    @Inject
    @Getter
    @Default(values = "Add your text here")
    private String subtitle;

    private Map<String, String> headingLevelConfig = new HashMap<String, String>(){{
        put("h1", "fw-bolder");
        put("h2", "fw-bold");
        put("h3", "fw-semibold");
        put("h4", "fw-normal");
        put("h5", "fw-light");
        put("h6", "fw-lighter");
    }};

    private Map<String, String> textAlignmentConfig = new HashMap<String, String>(){{
        put("center", "text-center");
        put("left", "text-start");
        put("right", "text-end");
    }};

    private Map<String, String> headingSizeConfig = new HashMap<String, String>(){{
        put("XXL", "fs-1");
        put("XL", "fs-2");
        put("L", "fs-3");
        put("M", "fs-4");
        put("S", "fs-5");
        put("XS", "fs-6");
    }};


    @Override
    @PostConstruct
    protected void init() {
        super.init();
        if (style != null) {
            style.addClasses(headingLevelConfig.get(headingLevel));
            style.addClasses(headingSizeConfig.get(headingSize));
            style.addClasses(textAlignmentConfig.get(textAlignment));
        }
    }
}
