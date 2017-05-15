/**
 * Created by kib357 on 12/10/15.
 */

import React from "react";
import template from "template";

class Html extends React.Component {
    createMarkup(text) {
        return { __html: text };
    }

    render() {
        const html = template.render(this.props.html, this.props.model, this.props.noSanitize);
        return (
            <div dangerouslySetInnerHTML={this.createMarkup(html)}></div>
        );
    }
}

Html.propTypes = {};
Html.defaultProps = {};

export default Html;
