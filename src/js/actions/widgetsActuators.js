/**
 * Created by kib357 on 09/11/15.
 */

import dispatcher from "../dispatcher/blankDispatcher";
import client from "../wamp/client";
import { serverActions } from "constants";

const requestsMap = {};

class WidgetActuators {
    load(storeName, widgetId, data, itemId) {
        const requestId = Date.now();
        requestsMap[widgetId] = requestId;
        client.call(
            `com.stores.${storeName}.widget-data`,
            widgetId,
            data,
            itemId || null,
            (error, res) => {
                if (requestsMap[widgetId] !== requestId) {
                    return;
                }

                dispatcher.dispatch({
                    actionType: serverActions.WIDGET_DATA_LOADED,
                    error: error,
                    data: res,
                    widgetId: widgetId,
                });
            }
        );
    }
}

export default new WidgetActuators();