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

package ai.typerefinery.websight.models.components.content;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import javax.inject.Named;

import lombok.Getter;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Model;
import org.jetbrains.annotations.Nullable;
import org.apache.sling.models.annotations.DefaultInjectionStrategy;
import ai.typerefinery.websight.models.components.BaseComponent;
import ai.typerefinery.websight.utils.PageUtil;

import org.apache.commons.lang3.StringUtils;
import org.apache.jackrabbit.vault.util.JcrConstants;
import org.apache.sling.api.SlingHttpServletRequest;

@Model(
    adaptables = {
        Resource.class,
        SlingHttpServletRequest.class
    },
    defaultInjectionStrategy = DefaultInjectionStrategy.OPTIONAL
)
public class Embed extends BaseComponent {

    private static final String PROPERTY_URL = "url";
    private static final String PROPERTY_SOURCE = "source";
    private static final String PROPERTY_AUTORESIZE = "autoResize";


    @Inject
    @Named(PROPERTY_URL)
    @Getter
    @Nullable
    private String url;

    @Inject
    @Named(PROPERTY_SOURCE)
    @Getter
    @Nullable
    private String source;

    @Inject
    @Named(PROPERTY_AUTORESIZE)
    @Getter
    @Nullable
    private String autoResize;

    @Inject
    @Getter
    @Nullable
    private String allowfullscreen;

    @Inject
    @Getter
    @Nullable
    private String scrolling;

    @Inject
    @Getter
    @Nullable
    private String height;


    @Override
    @PostConstruct
    protected void init() {
        super.init();

        if (title == null) {
            Resource page = PageUtil.getResourcePage(resource);
            // get title from page
            if (page.getChild(JcrConstants.JCR_CONTENT) != null) {
                Resource pageContent = page.getChild(JcrConstants.JCR_CONTENT);
                title = pageContent.getValueMap().get(JcrConstants.JCR_TITLE, String.class);
            }
  
        }
   
    }
}
