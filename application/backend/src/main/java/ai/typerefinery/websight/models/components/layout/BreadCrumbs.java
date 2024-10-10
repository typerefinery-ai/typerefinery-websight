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
package ai.typerefinery.websight.models.components.layout;
import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.ValueMapValue;
import org.jetbrains.annotations.Nullable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ai.typerefinery.websight.models.components.BaseComponent;
import ai.typerefinery.websight.models.components.list.ListItem;
import ai.typerefinery.websight.utils.ResourceUtils;
import pl.ds.websight.pages.core.api.Page;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import javax.inject.Named;
import javax.jcr.Node;

import org.apache.jackrabbit.util.Text;

import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;

import ai.typerefinery.websight.utils.LinkUtil;
import ai.typerefinery.websight.utils.PageUtil;

@Model(
    adaptables = {
        Resource.class,
        SlingHttpServletRequest.class
    },
    resourceType = { Accordion.RESOURCE_TYPE },
    defaultInjectionStrategy = OPTIONAL
)
@Exporter(name = "jackson", extensions = "json", options = {
        @ExporterOption(name = "MapperFeature.SORT_PROPERTIES_ALPHABETICALLY", value = "true"),
        @ExporterOption(name = "SerializationFeature.WRITE_DATES_AS_TIMESTAMPS", value = "false")
})
public class BreadCrumbs extends BaseComponent {
    private static final Logger LOGGER = LoggerFactory.getLogger(BreadCrumbs.class);
    
    public static final String RESOURCE_TYPE = "typerefinery/components/layout/breadcrumbs";

    protected static final boolean PROP_SHOW_HIDDEN_DEFAULT = false;
    protected static final boolean PROP_HIDE_CURRENT_DEFAULT = false;
    protected static final int PROP_START_LEVEL_DEFAULT = 2;

    private List<ListItem> items;

    @ValueMapValue
    @Default(intValues = PROP_START_LEVEL_DEFAULT)
    private int startLevel;

    @ValueMapValue
    @Default(booleanValues = PROP_SHOW_HIDDEN_DEFAULT)
    private boolean showHidden;

    @ValueMapValue
    @Default(booleanValues = PROP_HIDE_CURRENT_DEFAULT)
    private boolean hideCurrent;

    public Collection<ListItem> getItems() {
        if (items == null) {
            items = createItems();
        }
        return Collections.unmodifiableList(items);
    }

    @Override
    @PostConstruct
    protected void init() {
        super.init();        
    }

    private List<ListItem> createItems() {
        List<ListItem> items = new ArrayList<>();
        int currentLevel = ResourceUtils.getDepth(currentPage);
        Page currentPageModel = currentPage.adaptTo(Page.class);
        while (startLevel < currentLevel) {
            Page page = currentPageModel.getParentFromRoot(startLevel);
            if (page != null && page.getContentResource() != null) {
                boolean isActivePage = page.equals(currentPageModel);
                if (isActivePage && hideCurrent) {
                    break;
                }
                if (checkIfNotHidden(page)) {
                    ListItem listItem = new ListItem();
                    listItem.setTitle(page.getTitle());
                    listItem.setUrl(LinkUtil.handleLink(page.getPath(), resourceResolver));                
                    items.add(listItem);
                }
            }
            startLevel++;
        }
        return items;
    }

    private boolean checkIfNotHidden(Page page) {
        if (page == null) {
            return false;
        }
        String hideInNav = page.getContentProperty(PageUtil.PROPERTY_HIDEINNAV, "");
        boolean isNotHidden = true;
        if (hideInNav != null && !hideInNav.isEmpty()) {
            isNotHidden = !Boolean.parseBoolean(hideInNav);
        }
        return isNotHidden;
    }


}
