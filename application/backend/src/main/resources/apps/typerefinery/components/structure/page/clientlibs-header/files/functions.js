window.Typerefinery = window.Typerefinery || {};
Typerefinery.Page = Typerefinery.Page || {};
Typerefinery.Page.Files = Typerefinery.Page.Files || {};

(function ($, ns, document, window) {
    "use strict";

    ns.filesUrl = "https://files.typerefinery.localhost:8101";
    
    ns.uploadFile = async (file) => {
      const fileName = file?.name?.trim()?.replace(/\s/g, "-");
      const datePathWithTime =  new Date().toISOString().split("T")[0].replace(/-/g, "-") + "/" + new Date().toISOString().split("T")[1].split(".")[0].replace(/:/g, "-"); 
      let path = window.location.pathname === "/" ? "" : window.location.pathname;
      // remove .html from the path
      path = path.replace(".html", "");
      path += `/${datePathWithTime}`;
      const PREVIEW = `${ns.filesUrl}/api${path}/${fileName}`
      try{
          await fetch(
              `${ns.filesUrl}/api${path}?type=CREATE_FOLDER`,
              {
                  method: "POST",
                  mode: 'no-cors',
                  headers: {
                      'accept': 'application/json',
                      'Access-Control-Allow-Origin': '*',
                      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
                  },
                  redirect: 'follow'
              }
          );
      }   
      catch(error) {
          // ERROR IN CASE PATH EXIST.
      }     
      try{
          const URL = `${ns.filesUrl}/api${path}/${fileName}?type=UPLOAD_FILE&overwrite=true`;
          const formData = new FormData();
          formData.append("upload", file);
          await fetch(
              URL,
              {
                  method: "POST",
                  body: formData,
                  mode: 'no-cors',
                  headers: {
                      'accept': 'application/json',
                      'Access-Control-Allow-Origin': '*',
                      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
                  },
                  redirect: 'follow'
              },
          );
          // REMOVE LOADER 

          return PREVIEW;
      }catch(error) {
          return PREVIEW;
      }
      
  };

})(jQuery, Typerefinery.Page.Files, document, window);
