import React from "/apps/websight-atlaskit-esm/web-resources/react.js";
import { setView } from "/apps/websight/web-resources/js/viewControl.js";
import { HelperMessage } from "/apps/websight-atlaskit-esm/web-resources/@atlaskit/form.js";
import TextField from "/apps/websight-atlaskit-esm/web-resources/@atlaskit/textfield.js";
import Select from "/apps/websight-atlaskit-esm/web-resources/@atlaskit/select.js";
import Form from "/apps/websight-rest-atlaskit-client/web-resources/js/Form.js";
import { Modal } from "/apps/websight-ui-components/modal/web-resources/index.js";
import RestClient from "/apps/websight-rest-atlaskit-client/web-resources/js/RestClient.js";
import styled from "/apps/websight-atlaskit-esm/web-resources/styled-components.js";
import { colors } from "/apps/websight-atlaskit-esm/web-resources/@atlaskit/theme.js";

const ItemsContainer = styled.div`
  margin: 0;
  padding: 0;
  height: 228px;
  overflow-y: auto;
  position: relative;
  color: ${colors.N300};
`;

class PublisTreeModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isFormSubmitting: false,
      isFormValid: false,
    };
    this.restClient = new RestClient("typerefinery-backend");
    this.onSubmit = this.onSubmit.bind(this);
    this.onSuccess = this.onSuccess.bind(this);
    this.open = this.open.bind(this);
    this.close = this.close.bind(this);
    this.updateFormSubmitting = this.updateFormSubmitting.bind(this);
  }

  onSubmit(formData, ...submitArgs) {

    // submit rest call
    const {
      options
    } = formData;
    const {
      resourcePaths
    } = this.props;

    console.log("options", options);
    console.log("resourcePaths", resourcePaths);

    if (options) {
      if (resourcePaths?.length) {
        const parent = resourcePaths[0].substring(0, resourcePaths[0].lastIndexOf("/"));
        console.log("parent", parent);
        
        this.restClient.post({
          resourcePath: parent,
          action: "publish-tree-pages",
          data: {
            items: resourcePaths.map(path => path.substr(parent.length + 1)),
            options: options.value
          },
          onSuccess: () => { 
            console.log("onSuccess");
            const {
              onSuccess
            } = this.props;
            this.close();         
            onSuccess()
          },
        });
      }
      // this.close();
    }
  }

  open(name) {
    this.setState({
      isOpen: true,
      options: null,
      isFormSubmitting: false,
      isFormValid: false,
    });
  }

  close() {
    this.setState({
      isOpen: false,
      options: null,
      isFormSubmitting: false,
      isFormValid: false,
    });
  }

  updateFormValid(isFormValid) {
    this.setState({
      isFormValid
    });
  }

  updateFormSubmitting(isFormSubmitting) {
    this.setState({
      isFormSubmitting
    });
  }

  onSuccess() {
    const {
      onSuccess
    } = this.props;
    this.close();
    onSuccess();
  }

  render() {
    const {
      isOpen,
      isFormSubmitting,
      isFormValid,
      options
    } = this.state;
    return /*#__PURE__*/React.createElement(Modal, 
      {
        isOpen: isOpen,
        title: "Publish Tree",
        onClose: this.close,
        primaryAction: {
          title: "Publish",
          isLoading: isFormSubmitting,
          isDisabled: !isFormValid,
          onClick: () => this.form.submit()
        }
      },
      /*#__PURE__*/React.createElement(Form, 
        {
          ref: element => {
            this.form = element;
          },
          onSubmit: this.onSubmit,
          onSuccess: this.onSuccess,
          onSubmittedChange: this.updateFormSubmitting
        }, 
        () =>
          /*#__PURE__*/React.createElement(React.Fragment, 
            null, 
            /*#__PURE__*/React.createElement(ItemsContainer, 
              null, 
              /*#__PURE__*/React.createElement(Select, { 
                name: "options", 
                label: "Publish Options", 
                appearance: "default",
                options: [
                  { label: "Only Published", value: "onlypublished" },
                  { label: "All", value: "all" },
                ],
                autoFocus: true,
                isRequired: true,
                isMulti: false,
                value: options,
                onChange: (value) => {
                  console.log("value", value);
                  this.updateFormValid(value !== "");
                }
              }),
            )
          )      
      )
    );
  }

}

PublisTreeModal.defaultProps = {
  hideSuccessNotification: false
};
export default PublisTreeModal;