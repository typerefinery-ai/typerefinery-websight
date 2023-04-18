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

package ai.typerefinery.websight.models.components.widgets.tabs;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.PostConstruct;
import javax.inject.Inject;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.sling.api.resource.Resource;
import org.apache.sling.engine.SlingRequestProcessor;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.OSGiService;

import ai.typerefinery.websight.models.components.BaseComponent;
import ai.typerefinery.websight.models.components.KeyValuePair;
import ai.typerefinery.websight.utils.FakeRequest;
import ai.typerefinery.websight.utils.FakeResponse;
import lombok.Getter;
import org.apache.sling.models.annotations.Default;

@Model(adaptables = Resource.class, defaultInjectionStrategy = OPTIONAL)
public class Tabs extends BaseComponent {

    public static final String RESOURCE_TYPE = "typerefinery/components/widgets/tab";

    @Inject
    public List<TabItem> listOfTab;



    @Inject
    @Getter
    public List<KeyValuePair> events;

    
    @Inject
    @Getter
    public String placeholderContent;

    @Inject
    @Getter
    @Default(values = "80vh")
    public String contentHeight;

    
    @Inject
    @Getter
    @Default(values = "")
    public String variant;

    @Getter
    protected Resource inheritedResource;
    
    @OSGiService
    private SlingRequestProcessor requestProcessor;


    @Override
    @PostConstruct
    protected void init() {
        super.init();
    }

    public List<TabItem> getListOfTabAsIFrame() {
        return listOfTab;
    }

    public List<TabItem> getListOfTab() {
        try {
            List<TabItem> result = new ArrayList<TabItem>();

            // iterate over the tabs and render them
            for (TabItem tabItem : listOfTab) {
                // render the tab content
                String tabPath = tabItem.getPath();
                String url = tabPath + ".html";
                

                HttpServletRequest req = new FakeRequest("GET", url);

                ByteArrayOutputStream out = new ByteArrayOutputStream();
                HttpServletResponse resp;
                try {
                    resp = new FakeResponse(out);

                    // this needs to be done to get the inherited resource
                    requestProcessor.processRequest(req, resp, resourceResolver);

                    // need to flush the response to get the contents
                    resp.getWriter().flush();

                    // trim to remove all the extra whitespace
                    String html = out.toString().trim();

                    // push to result.
                    TabItem tabItemWithContent = new TabItem();
                    tabItemWithContent.setTitle(tabItem.getTitle());
                    tabItemWithContent.setId(tabItem.getId());
                    tabItemWithContent.setHtml(html);
                    tabItemWithContent.setIcon(tabItem.getIcon());
                    tabItemWithContent.setPath(tabItem.getPath());
                    tabItemWithContent.setIsCloseable(tabItem.getIsCloseable());
                    tabItemWithContent.setUseQueryParamsFromParent(tabItem.getUseQueryParamsFromParent());
                    result.add(tabItemWithContent);

                } catch (ServletException | IOException | NoSuchAlgorithmException e) {
                    return null;
                }
                
            }
            return result;
        } catch (Exception e) {
            return null;
        }
    }

}