import React from "/apps/websight-atlaskit-esm/web-resources/react.js";
import PublishSpaceModal from "/apps/typerefinery/components/actions/spaces/publishspace.modal.js";

class PublishSpaceAction extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.execute = this.execute.bind(this);
  }

  execute(space) {
    console.log("space", space);
    this.setState({
      spaceName: space.name,
      spacePath: space.path
    });
    this.modalRef.open(space);
  }


  render() {
    const {
      spaceName,
      spacePath,
      executeCallback
    } = this.props;
    return /*#__PURE__*/React.createElement(PublishSpaceModal, {
      spaceName: spaceName,
      spacePath: spacePath,
      onSuccess: () => executeCallback(),
      ref: element => {
        this.modalRef = element;
      },
      testId: "Modal_PublishSpace"
    });
  }

}

const publishSpace = {
  data: {
    name: "Publish Space",
    icon: "park",
    properties: {
      appearance: "primary"
    }
  },
  actionComponent: PublishSpaceAction
};
export default publishSpace;