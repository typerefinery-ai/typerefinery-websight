package io.typerefinery.websight.models.components.layout;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import java.io.StringWriter;
import java.io.Writer;
import java.util.TreeMap;

import javax.inject.Inject;
import lombok.Getter;

import org.apache.commons.lang3.StringUtils;
import org.apache.jackrabbit.vault.util.JcrConstants;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceUtil;
import org.apache.sling.models.annotations.Model;
import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

import io.typerefinery.websight.models.components.BaseComponent;
import io.typerefinery.websight.utils.PageUtil;

@Model(adaptables = Resource.class, defaultInjectionStrategy = OPTIONAL)
public class SideBar extends BaseComponent {

    /**
     * page to use as the root of the tree
     */
    @Getter
    @Inject
    public String parentPagePath;

    
    @Inject
    @Getter
    private NavigationComponent navigation;

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
        children.put(JcrConstants.JCR_CONTENT, new TreeMap<String, Object>() {{
            put("name", resourceName);
            put("key", parentPage.getPath());
            put("title", parentPage.getValueMap().get(JcrConstants.JCR_TITLE, resourceName));
            // put(PageUtil.PROPERY_HIDEINNAV, parentPage.getValueMap().get(PageUtil.PROPERY_HIDEINNAV, false));
        }});
        
        for (Resource child : parentPage.getChildren()) {
            if (child.getResourceType().equals(resourceType)) {
                //if child has hideInNav property is not set to true, add it to the children hashmap
                if (child.getValueMap().get(PageUtil.PROPERY_HIDEINNAV, "false").equals("false")) {
                    children.put(child.getName(), getChildrenPages(child, resourceType));
                }
            }
        }
        return children;
    }
  
}
