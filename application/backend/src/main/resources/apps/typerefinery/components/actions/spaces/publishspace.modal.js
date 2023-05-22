import React from "/apps/websight-atlaskit-esm/web-resources/react.js";
import { setView } from "/apps/websight/web-resources/js/viewControl.js";
import { HelperMessage } from "/apps/websight-atlaskit-esm/web-resources/@atlaskit/form.js";
import TextField from "/apps/websight-atlaskit-esm/web-resources/@atlaskit/textfield.js";
import Toggle from "/apps/websight-atlaskit-esm/web-resources/@atlaskit/toggle.js";
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

class PublshSpaceModal extends React.Component {
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
      options,
      deploy
    } = formData;
    const {
      space,
      spaceName,
      spacePath
    } = this.state;

    console.log("options", options);
    console.log("space", space);
    console.log("spaceName", spaceName);
    console.log("spacePath", spacePath);

    if (options) {
      if (spacePath) {
        
        this.restClient.post({
          resourcePath: spacePath,
          action: "publish-space",
          data: {
            items: spacePath,
            options: options.value,
            deploy: deploy
          },
          onSuccess: () => { 
            console.log("onSuccess");
            const {
              onSuccess
            } = this.props;
            this.close();         
            onSuccess()
          },
          onError: () => {
            console.log("onError");
            const {
              onError
            } = this.props;
            this.close();
            onError();
          }
        });
      }
      // this.close();
    }
  }

  open(space) {
    console.log("open", space);
    this.setState({
      isOpen: true,
      options: null,
      isFormSubmitting: false,
      isFormValid: false,
      space: space,
      spaceName: space.name,
      spacePath: space.path
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
      options,
      spaceName,
      spacePath
    } = this.state;
    return /*#__PURE__*/React.createElement(Modal, 
      {
        isOpen: isOpen,
        title: "Publish Space",
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
              /*#__PURE__*/React.createElement(Toggle, { 
                name: "deploy", 
                label: "Deploy after Publish", 
                size: "large",
                appearance: "default",
                onChange: (value) => {
                  console.log("deploy value", value);
                  this.updateFormValid(value !== "");
                }
              }),
            )
          )      
      )
    );
  }

}

PublshSpaceModal.defaultProps = {
  hideSuccessNotification: false
};
export default PublshSpaceModal;