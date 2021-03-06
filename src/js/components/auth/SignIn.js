/**
 * Created by kib357 on 16/05/15.
 */

import React from "react";
import Locales from "./Locales";
import Loader from "../misc/Loader";
import SimpleForm from "../forms/SimpleForm";
import i18n from "../../stores/i18nStore";
import config from "../../stores/configStore";
import actions from "../../actions/credentialsActuators";
import configHelpers from "../../utils/configHelpers";
import { createHash } from "crypto";

let sceneAliases = new Map([
    ["", 1],
    ["#", 1],
    ["#login", 1],
    ["#register", 2],
    ["#send-reset-link", 3],
    ["#reset-password", 4],
]);

export default class SignIn extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            widgets: this._getProps("widgets"),
        };
        this.state.data = { $state: "new" };
        this.state.scene = sceneAliases.get(window.location.hash) || 1;
        this.state.emailError = "";
        this.state.sceneDescs = {
            signIn: { access: "ru", props: this._getProps("signInProps") },
            signUp: { access: "ru", props: this._getProps("signUpProps") },
            resetPassword: { access: "ru", props: this._getProps("resetPasswordProps") },
            sendResetLink: { access: "ru", props: this._getProps("resetPasswordRequestProps") },
        };
        for (let sceneDescName of Object.keys(this.state.sceneDescs)) {
            configHelpers.prepareProps(this.state.sceneDescs[sceneDescName], sceneDescName);
        }

        this.onHashChange = this.onHashChange.bind(this);
        this.setScene = this.setScene.bind(this);

        configHelpers.prepareWidgets({ widgets: this.state.widgets });
    }

    componentDidMount() {
        if (!window.location.hash) {
            window.location.hash = "#";
        }
        window.addEventListener("hashchange", this.onHashChange);
    }

    componentWillUnmount() {
        window.removeEventListener("hashchange", this.onHashChange);
        clearTimeout(this.state.sceneTimer);
    }

    fbLogin() {
        let fbClientId = config.getParameter("facebookClientId");
        let redirectUri = config.getParameter("baseUrl") + "/facebook-login";
        let redirectUrl = location.search.match(/redirectUrl=([^&]*)&?/);
        if (redirectUrl) {
            redirectUri += `?redirectUrl=${redirectUrl[1]}`;
        }
        let fbUri = `https://www.facebook.com/dialog/oauth?client_id=${fbClientId}&redirect_uri=${redirectUri}&response_type=code&scope=email,public_profile`;
        window.location.href = fbUri;
    }

    onHashChange() {
        var scene = sceneAliases.get(window.location.hash) || this.state.scene;
        if (scene !== this.state.scene) {
            this.setState({ scene: scene, data: {} });
        }
    }

    setScene(e) {
        if (this.state.sceneTimer != null) {
            return;
        }
        var scene = e.currentTarget.getAttribute("data-scene");
        let timer = setTimeout(() => {
            window.location.hash = "#" + scene;
            this.setState({ sceneTimer: null });
        }, 300);
        this.setState({ sceneTimer: timer });
        e.preventDefault();
    }

    handleDataChange(data) {
        this.setState({ data: data });
    }

    setDataTouched() {
        this.state.data.$touched = true;
        this.setState({ data: this.state.data });
    }

    performAction(actionName) {
        const action = actions[actionName];
        this.setState({ data: Object.assign(this.state.data, { $state: "saving" }) }, () => {
            const successMessage = i18n.get(
                "signUp.success" + (config.isUserActivationNeeded() ? "NeedActivation" : ""),
            );
            const data = Object.assign({}, this.state.data);
            for (const propName of Object.keys(data)) {
                if (propName[0] === "$") {
                    delete data[propName];
                }

                if (propName === "password") {
                    data["hashedPassword"] = createHash("md5")
                        .update(data[propName])
                        .digest("hex");
                    delete data[propName];
                }
            }

            action(data, successMessage)
                .then(res => {
                    if (actionName !== "signIn") {
                        this.setState({ data: { $state: "new" } });
                    }
                })
                .catch(err => {
                    this.setState({ data: Object.assign(this.state.data, { $state: "new" }) });
                });
        });
    }

    render() {
        const { scene, sceneTimer, loading } = this.state;
        if (loading) {
            return <Loader className="center" />;
        }

        const logo = config.getParameter("signInLogo");
        const logoHref = config.getParameter("signInLogoHref") || config.getParameter("titleHref");

        return (
            <div className="sign-in-container">
                <Locales />

                <div className="sign-in-logo">
                    {logo ? (
                        logoHref ? (
                            <a href={logoHref} target="_blank" rel="noopener noreferrer">
                                <img src={logo} alt="logo" />
                            </a>
                        ) : (
                            <img src={logo} alt="logo" />
                        )
                    ) : null}
                </div>
                <div className="scenes">
                    <div className={"scene" + (scene && sceneTimer == null ? " scene-show-delayed" : "")}>
                        {scene ? this._getScene(scene) : null}
                    </div>
                </div>
            </div>
        );
    }

    _getProps(formName) {
        var props = config.getParameter(formName);
        for (var propName of Object.keys(props || {})) {
            props[propName].groupAccess = "ru";
        }
        return props;
    }

    _getScene(scene) {
        let sceneName;
        if (scene === 1) sceneName = "signIn";
        if (scene === 2) sceneName = "signUp";
        if (scene === 3) sceneName = "sendResetLink";
        if (scene === 4) sceneName = "resetPassword";

        const { widgets } = this.state;

        let disableReset = config.getParameter("resetPasswordDisabled"),
            disableSignUp = config.getParameter("signUpDisabled");
        if (
            (disableReset && sceneName === "sendResetLink") ||
            (disableReset && sceneName === "resetPassword") ||
            (disableSignUp && sceneName === "signUp")
        ) {
            return null;
        }
        return (
            <span>
                <div className="scene-content">
                    <h1>
                        <span>{i18n.get(sceneName + ".title")}</span>
                    </h1>

                    <div>
                        <SimpleForm
                            storeDesc={this.state.sceneDescs[sceneName]}
                            storeName={sceneName}
                            disableAutoComplete={sceneName === "signUp" || sceneName === "resetPassword"}
                            onSubmit={this.performAction.bind(this, sceneName)}
                            onSubmitError={this.setDataTouched.bind(this)}
                            item={this.state.data}
                            actions={{}}
                            onChange={this.handleDataChange.bind(this)}
                            directWrite={true}
                            hideCancel={true}
                            hideDelete={true}
                            buttonsContainerClassName="buttons-right"
                            saveText={i18n.get(sceneName + ".action")}
                            saveClass="btn-flat btn-accent first last"
                        />
                        <span className="error">{this.state.error}</span>
                    </div>
                    {sceneName === "resetPassword" || (disableReset && disableSignUp) ? null : (
                        <div className="scene-controls">
                            {sceneName === "signUp" || disableSignUp ? null : (
                                <button
                                    type="button"
                                    className="btn-flat first"
                                    data-scene="register"
                                    onClick={this.setScene}
                                >
                                    {i18n.get("signUp.link") || i18n.get("signUp.title")}
                                </button>
                            )}
                            {sceneName === "signIn" ? null : (
                                <button
                                    type="button"
                                    className={
                                        "btn-flat" +
                                        (sceneName === "signUp" ? " first" : "") +
                                        (sceneName === "sendResetLink" ? " last" : "")
                                    }
                                    data-scene="login"
                                    onClick={this.setScene}
                                >
                                    {i18n.get("signIn.link") || i18n.get("signIn.title")}
                                </button>
                            )}
                            {sceneName === "sendResetLink" || disableReset ? null : (
                                <button
                                    type="button"
                                    className={
                                        "btn-flat" +
                                        (sceneName === "signUp" ? " last" : "") +
                                        (sceneName === "signIn" ? " last" : "")
                                    }
                                    data-scene="send-reset-link"
                                    onClick={this.setScene}
                                >
                                    {i18n.get("sendResetLink.link") || i18n.get("sendResetLink.title")}
                                </button>
                            )}
                        </div>
                    )}
                </div>
                {config.getParameter("facebookClientId") == null ? null : (
                    <div style={{ marginTop: "20px" }}>
                        <label style={{ color: "rgba(0, 0, 0, 0.54)" }}>Войти через: </label>
                        <button type="button" className="btn-flat" onClick={this.fbLogin}>
                            <i
                                className="fa fa-facebook-official"
                                style={{ fontSize: "28px", color: "#3B5998" }}
                                aria-hidden="true"
                            />
                        </button>
                    </div>
                )}
                {widgets &&
                    (widgets || []).map((w, i) => {
                        const ReactWidget = w.$component;
                        return <ReactWidget key={i} />;
                    })}
            </span>
        );
    }
}
