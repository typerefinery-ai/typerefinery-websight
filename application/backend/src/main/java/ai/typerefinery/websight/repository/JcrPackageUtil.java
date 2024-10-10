package ai.typerefinery.websight.repository;

import java.util.EnumSet;
import java.util.Locale;
import java.util.Optional;
import javax.jcr.Node;
import javax.jcr.NodeIterator;
import javax.jcr.RepositoryException;
import javax.jcr.Session;
import org.apache.commons.lang3.StringUtils;
import org.apache.jackrabbit.vault.fs.api.ImportMode;
import org.apache.jackrabbit.vault.fs.config.MetaInf;
import org.apache.jackrabbit.vault.fs.io.AccessControlHandling;
import org.apache.jackrabbit.vault.packaging.JcrPackage;
import org.apache.jackrabbit.vault.packaging.JcrPackageDefinition;
import org.apache.jackrabbit.vault.packaging.JcrPackageManager;
import org.apache.jackrabbit.vault.packaging.PackageId;
import org.jetbrains.annotations.NotNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


public class JcrPackageUtil {
  private static final Logger LOG = LoggerFactory.getLogger(JcrPackageUtil.class);
   private static final String PACKAGE_VLT_REL_PATH = "/jcr:content/vlt:definition";
   public static final Locale DEFAULT_LOCALE;
   public static final String NN_PACKAGE_THUMBNAIL = "thumbnail.png";
   public static final String THUMBNAIL_REL_PATH = "/jcr:content/vlt:definition/thumbnail.png";
   public static final String PACKAGE_FILTERS_REL_PATH = "/jcr:content/vlt:definition/filter";
   public static final String PACKAGES_ROOT_PATH = "/etc/packages/";
   public static final String NO_GROUP = ":no_group";

   private JcrPackageUtil() {
   }

   public static boolean hasValidFilters(Session session, String jcrPackagePath) {
      String filtersPath = jcrPackagePath + "/jcr:content/vlt:definition/filter";

      try {
         if (!session.nodeExists(filtersPath)) {
            return false;
         } else {
            NodeIterator filterNodes = session.getNode(filtersPath).getNodes();
            if (!filterNodes.hasNext()) {
               return false;
            } else {
               Node filterNode;
               do {
                  if (!filterNodes.hasNext()) {
                     return true;
                  }

                  filterNode = filterNodes.nextNode();
               } while(filterNode.hasProperty("root") && filterNode.hasProperty("mode"));

               return false;
            }
         }
      } catch (RepositoryException var5) {
         LOG.warn("Could not check package filters", var5);
         return false;
      }
   }

   public static boolean hasValidWorkspaceFilter(JcrPackage jcrPackage) {
      return (Boolean)fetchDefinition(jcrPackage).map((definition) -> {
         try {
            return definition.getMetaInf();
         } catch (RepositoryException var2) {
            return null;
         }
      }).map((metaInf) -> {
         return metaInf.getFilter() != null;
      }).orElse(false);
   }

   public static boolean isValidPackageNode(Node packageNode) {
      try {
         if (packageNode.isNodeType("nt:hierarchyNode") && packageNode.hasNode("jcr:content")) {
            return packageNode.getNode("jcr:content").isNodeType("vlt:Package");
         }
      } catch (RepositoryException var2) {
         LOG.warn("Error during node validation", var2);
      }

      return false;
   }

   public static ImportMode toImportMode(String importModeName) {
      return (ImportMode)getEnum(importModeName, ImportMode.class, ImportMode.REPLACE);
   }

   public static AccessControlHandling toAcHandling(String acHandlingName) {
      String formattedAcHandlingName = StringUtils.join(StringUtils.splitByCharacterTypeCamelCase(acHandlingName), "_");
      formattedAcHandlingName = StringUtils.lowerCase(formattedAcHandlingName, DEFAULT_LOCALE);
      return getEnum(formattedAcHandlingName, AccessControlHandling.class, null);
    //   return (AccessControlHandling)getEnum(formattedAcHandlingName, AccessControlHandling.class, (Enum)null);
   }

   private static <E extends Enum<E>> E getEnum(String enumName, Class<E> enumClass, E defaultValue) {
      return (E)EnumSet.allOf(enumClass).stream().filter((enumVal) -> {
         return enumVal.name().equalsIgnoreCase(enumName);
      }).findFirst().orElseGet(() -> {
         if (LOG.isDebugEnabled()) {
            LOG.debug("Could not recognize value: {} in Enum class: '{}'", enumName, enumClass.getSimpleName());
         }

         return defaultValue;
      });
   }

   public static String getSimplePackageName(String name, String version) {
      return name + (!version.isEmpty() ? "-" + version : "") + ".zip";
   }

    public static String getSimplePackageName(JcrPackage jcrPackage) {
        return fetchDefinition(jcrPackage)
        .map(JcrPackageDefinition::getId)
        .map(PackageId::getDownloadName)
        .orElse(null);
    }

   public static @NotNull String getGroupIdFromNode(Node packageRoot, Node groupNode) throws RepositoryException {
      return groupNode.getPath().substring(packageRoot.getPath().length() + 1);
   }

   public static Optional<JcrPackageDefinition> fetchDefinition(JcrPackage jcrPackage) {
      try {
         return Optional.ofNullable(jcrPackage.getDefinition());
      } catch (RepositoryException var2) {
         LOG.warn("Cannot get package definition", var2);
         return Optional.empty();
      }
   }

   public static void close(JcrPackage jcrPackage) {
      if (jcrPackage != null) {
         jcrPackage.close();
      }

   }

   public static JcrPackage open(String packagePath, Session session, JcrPackageManager packageManager) throws RepositoryException, OpenPackageException {
      Node packageNode = session.getNode(packagePath);
      JcrPackage openedPackage = packageManager.open(packageNode);
      if (openedPackage == null) {
         throw new OpenPackageException(packagePath);
      } else {
         return openedPackage;
      }
   }

   public static long countPackages(Node root, long limit, boolean deep) throws RepositoryException {
      long packages = 0L;
      NodeIterator nodeIterator = root.getNodes();

      while(nodeIterator.hasNext() && packages <= limit) {
         Node child = nodeIterator.nextNode();
         if (!".snapshot".equals(child.getName())) {
            if (isValidPackageNode(child)) {
               ++packages;
            } else if (deep && child.hasNodes()) {
               packages += countPackages(child, limit - packages, true);
            }
         }
      }

      return packages;
   }

   static {
      DEFAULT_LOCALE = Locale.ENGLISH;
   }

}
