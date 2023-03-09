package io.typerefinery.websight.models.components.layout;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import java.io.StringWriter;
import java.io.Writer;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.Map;
import java.util.TreeMap;

import javax.annotation.PostConstruct;
import javax.inject.Inject;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
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
import io.typerefinery.websight.utils.DefaultImageUtil;
import io.typerefinery.websight.utils.LinkUtil;
import io.typerefinery.websight.utils.PageUtil;

@Model(adaptables = Resource.class, defaultInjectionStrategy = OPTIONAL)
public class SideBar extends BaseComponent {

    public static final String DEFAULT_BACKGROUND_COLOR = "secondary";
    public static final String DEFAULT_TITLE = "Typerefinery";
    public static final String DEFAULT_EXPAND_ICON = "glyphicon glyphicon-arrow-down";
    public static final String DEFAULT_COLLAPSE_ICON = "glyphicon glyphicon-arrow-up";
    public static final String DEFAULT_LOGO_POSITION = "column";
    public static final Integer LG_BREAKPOINT_MIN_WIDTH = 970;
    public static final Integer MD_BREAKPOINT_MIN_WIDTH = 970;
    

    /**
     * page to use as the root of the tree
     */
    @Inject
    @Getter
    public String parentPagePath;

    /**
     * background color of the sidebar
     */
    @Inject
    @Getter
    public String backgroundColor;

    /**
     * text and the icon color of the sidebar
     */
    @Inject
    @Getter
    public String textColor;

    /**
     * title of the sidebar
     */
    @Inject
    @Getter
    public String title;

    /**
     * position of the logo
     */
    @Inject
    @Getter
    public String logoPosition;

    /**
     * is the sidebar expanded by default
     */
    @Inject
    @Getter
    public Boolean isNodeExpandedByDefault;

    /**
     * expand icon of the sidebar
     */
    @Inject
    @Getter
    public String expandIcon;

    /**
     * collapse icon of the sidebar
     */
    @Inject
    @Getter
    public String collapseIcon;



    /**
     * logo of the sidebar based on screen size (sm, md, lg) 
     */
    @Inject
    private String logoSm;

    @Inject
    private String logoMd;

    @Inject
    private String logoLg;

    
    @Inject
    @Getter
    private String defaultLogo;
    
    @Getter
    private Collection<ImageSource> imageSources;

    private void initImageSources() {
        imageSources = new LinkedList<>();
        if (StringUtils.isNotEmpty(logoLg)) {
            imageSources.add(new ImageSource(LinkUtil.handleLink(logoLg, resourceResolver),
                    LG_BREAKPOINT_MIN_WIDTH));
        }
        if (StringUtils.isNotEmpty(logoSm) && StringUtils.isNotEmpty(logoMd)) {
            imageSources.add(new ImageSource(LinkUtil.handleLink(logoMd, resourceResolver),
                    MD_BREAKPOINT_MIN_WIDTH));
        }
    }

    private void initDefaultLogo() {
        defaultLogo = LinkUtil.handleLink(
                DefaultImageUtil.chooseDefaultImage(logoLg, logoMd, logoSm),
                resourceResolver);
    }

    public Map<String, String> backgroundColorConfig = new HashMap<String, String>() {
        {
            put("primary", "#0d6efd");
            put("secondary", "#6c757d");
            put("info", "#0dcaf0");
            put("light", "#f8f9fa");
            put("dark", "#212529");
        }
    };

    public Map<String, String> textColorConfig = new HashMap<String, String>() {
        {
            put("primary", "#ffffff");
            put("secondary", "#ffffff");
            put("info", "#ffffff");
            put("light", "#000000");
            put("dark", "#ffffff");
        }
    };
    
    @Override
    @PostConstruct
    protected void init() {
        super.init();
        initImageSources();
        initDefaultLogo();
        // If no background color is set, use the default
        if (StringUtils.isBlank(backgroundColor)) {
            backgroundColor = DEFAULT_BACKGROUND_COLOR;
        }
        textColor = textColorConfig.get(backgroundColor);
        backgroundColor = backgroundColorConfig.get(backgroundColor);

        // if no logo position is set, use the default
        if (StringUtils.isBlank(logoPosition)) {
            logoPosition = DEFAULT_LOGO_POSITION;
        }

        // If no title is set, use the default
        if (StringUtils.isBlank(title)) {
            title = DEFAULT_TITLE;
        }

        //  If no expandIcon is set, use the default
        if (StringUtils.isBlank(expandIcon)) {
            expandIcon = DEFAULT_EXPAND_ICON;
        }

        //  If no collapseIcon is set, use the default
        if (StringUtils.isBlank(collapseIcon)) {
            collapseIcon = DEFAULT_COLLAPSE_ICON;
        }

        // If no logo is set, use the default
        // if (StringUtils.isBlank(logoSm)) {
        //     logoSm = "/content/dam/websight/images/logo-sm.png";
        // }
        // if (StringUtils.isBlank(logoMd)) {
        //     logoMd = "/content/dam/websight/images/logo-md.png";
        // }
        // if (StringUtils.isBlank(logoLg)) {
        //     logoLg = "/content/dam/websight/images/logo-lg.png";
        // }

        // If no parent page path is set, use the current page
        if (StringUtils.isBlank(parentPagePath)) {
            parentPagePath = currentPage.getPath();
        }

        // If the parent page path is set, but does not exist, use the current page
        if (StringUtils.isNotBlank(parentPagePath) && !currentPage.getPath().equals(parentPagePath)) {
            Resource parentPage = currentPage.getResourceResolver().getResource(parentPagePath);
            if (parentPage == null) {
                parentPagePath = currentPage.getPath();
            }
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
  
    @Getter
    @AllArgsConstructor
    @EqualsAndHashCode
    public static class ImageSource {

        private String image;
        private Integer minWidth;
    }
}
