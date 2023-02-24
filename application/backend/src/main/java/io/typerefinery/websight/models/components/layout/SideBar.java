package io.typerefinery.websight.models.components.layout;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import java.io.StringWriter;
import java.io.Writer;
import java.util.TreeMap;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import lombok.Getter;

import org.apache.commons.lang3.StringUtils;
import org.apache.jackrabbit.vault.util.JcrConstants;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceUtil;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.api.resource.ValueMap;
import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

import io.typerefinery.websight.models.components.BaseComponent;
import io.typerefinery.websight.utils.PageUtil;

@Model(adaptables = Resource.class, defaultInjectionStrategy = OPTIONAL)
public class SideBar extends BaseComponent {

    private String DEFAULT_APP_NAME = "Typerefinery";
    private String DEFAULT_ID = "sidebar";
    private String DEFAULT_MODULE = "sidebar";

    /**
     * page to use as the root of the tree
     */
    @Inject
    @Getter
    public String parentPagePath;

    @Inject
    @Getter
    public String appName;

    
    @Inject
    @Getter
    private NavigationComponent navigation;

    
    @Override
    @PostConstruct
    protected void init() {
        this.id = DEFAULT_ID;
        this.module = DEFAULT_MODULE;
        super.init();

        if(StringUtils.isBlank(appName)){
            appName = DEFAULT_APP_NAME;
        }
    }
    

    /**
     * Returns the tree as a JSON string
     * @return the tree as a JSON string
     */
    public String getTreeJSON() {
        TreeMap<String, Object> map = getTree();
        try {
            ObjectMapper mapper = new ObjectMapper().configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
            JsonFactory jsonFactory = new JsonFactory();
            Writer writer = new StringWriter();
            JsonGenerator jsonGenerator = jsonFactory.createGenerator(writer);
            mapper.writeTree(jsonGenerator, mapper.valueToTree(map));
            return writer.toString();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return "";
    }
   
    
    /**
     * Returns a tree map of the current page and all its children
     * @return a tree map of the current page and all its children
     */
    public TreeMap<String, Object> getTree() {
        TreeMap<String, Object> tree = new TreeMap<>();
        Resource rootPage = currentPage;
        //if parentPagePath is set and it exists, use that as the root of the tree 
        if (StringUtils.isNotBlank(parentPagePath)) {
            Resource parentPagePathResopurce = resourceResolver.resolve(parentPagePath);
            if (!ResourceUtil.isNonExistingResource(parentPagePathResopurce)) {
                rootPage = parentPagePathResopurce;
            } else {
                //return blank if parentPagePath is set but does not exist
                return tree;
            }
        }
        tree.put(rootPage.getName(), getChildrenPages(rootPage, rootPage.getResourceType()));
        return tree;
    }

    /**
     * Returns a tree map of the children of the current page
     * @param parentPage parent page for which to get the children
     * @param resourceType the resource type of the current page
     * @return a tree map of the children of the current page
     */
    private TreeMap<String, Object> getChildrenPages(Resource parentPage, String resourceType) {
        TreeMap<String, Object> children = new TreeMap<>();
        String resourceName = parentPage.getName();
        ValueMap parentPageContentVM = PageUtil.getResourceContentValueMap(parentPage);

        if(parentPageContentVM == null) {
            parentPageContentVM = parentPage.getValueMap();
        }

        String title = parentPageContentVM.get(PageUtil.PROPERTY_TITLE, resourceName);
        String icon = parentPageContentVM.get(PageUtil.PROPERTY_ICON, "");
        String description = parentPageContentVM.get(PageUtil.PROPERTY_DESCRIPTION, "");
        
        children.put(JcrConstants.JCR_CONTENT, new TreeMap<String, Object>() {{
            put("name", resourceName);
            put("key", parentPage.getPath());
            put("title", title);
            put("icon", icon);
            put("description", description);
        }});
        
        for (Resource child : parentPage.getChildren()) {
            if (child.getResourceType().equals(resourceType)) {
                //if child has hideInNav property is not set to true, add it to the children hashmap
                if (child.getValueMap().get(PageUtil.PROPERTY_HIDEINNAV, "false").equals("false")) {
                    children.put(child.getName(), getChildrenPages(child, resourceType));
                }
            }
        }
        return children;
    }
  
}
