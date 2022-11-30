// cta javascript
// setTimeout(() => {
//   (function (vueapp) {
//     // vueapp.methods.clickevent = clickevent1;
//     vueapp._component.methods={
//       clickevent(){
//       alert("hello");
//     }}
//     console.log("cta javascript");
//     console.log("vueapp", vueapp);
//     console.log("app", vueapp.App);
//     console.log("vue", vueapp.Vue);
//   })(vueapp);
// }, 0);
setTimeout(() => {
  (function (vueapp) {
        // vueapp.methods.clickevent = clickevent1;
        vueapp._component.methods={
          clickevent(){
            alert("hello")
          }
        }
        vueapp._component.data=()=>{
          return{
            firstname:"rahul"
          }
        }
        console.log("cta javascript");
        console.log("vueapp", vueapp);
        console.log("app", vueapp.App);
        console.log("vue", vueapp.Vue);
        vueapp.use(primevue.config.default).mount("#app")
      })(window.vueapp);
  
  
 
}, 0);