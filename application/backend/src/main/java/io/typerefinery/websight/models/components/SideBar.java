package io.typerefinery.websight.models.components;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import java.util.HashMap;
import javax.inject.Inject;
import lombok.Getter;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.SlingObject;

// import google Gson library
import com.google.gson.Gson;

@Model(adaptables = Resource.class, defaultInjectionStrategy = OPTIONAL)
public class SideBar {
    @Getter
    @SlingObject
    private Resource resource;


    // return output of SideBar.getTree() as a JSON string
    public String getTreeJSON() {
        HashMap<String, Object> map = getTree();
        return new Gson().toJson(map);
    }
   

    //return a hashmap with object containing title and resource children representing the tree of all the children in the current path ignoring all the children with the property hideInNav
    public HashMap<String, Object> getTree() {
        HashMap<String, Object> tree = new HashMap<>();
        // create a new Hashmap jcr:content with title and hideInNav and add to the tree
        // tree.put("jcr:content", new HashMap<String, Object>() {{
        //     put("name", resource.getName());
        //     put("title", resource.getValueMap().get("jcr:title", ""));
        //     put("hideInNav", resource.getValueMap().get("hideInNav", false));
        // }});
        
        tree.put(resource.getName(), getChildren(resource));
        return tree;
        //return getChildren(resource);
    }
    private HashMap<String, Object> getChildren(Resource resource) {
        HashMap<String, Object> children = new HashMap<>();
        children.put("jcr:content", new HashMap<String, Object>() {{
            put("name", resource.getName());
            put("key", resource.getPath());
            put("title", resource.getValueMap().get("jcr:title", ""));
            put("hideInNav", resource.getValueMap().get("hideInNav", false));
        }});
        
        for (Resource child : resource.getChildren()) {
            if (!child.getValueMap().get("hideInNav", Boolean.class)) {
                children.put(child.getName(), getChildren(child));
            }
        }
        return children;
    }
  
}
