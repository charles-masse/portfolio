
import * as YUKA from 'yuka';

class ModuleBridge {

    constructor() {

        this._messageDispatcher = new YUKA.MessageDispatcher();

        this.modules = new Map();

    }

    add(id, module) {

        this.modules.set(id, module);

        module.bridge = this;

        return this;
    }

    get(id) {
        return this.modules.get(id);
    }

    remove(module) {

        const index = this.modules.indexOf(module);
        this.modules.splice( index, 1 );

        module.bridge = null;

        return this;
    }

    sendMessage(sender, receiver, message, delay, data) {

        if (receiver != undefined) {
            this._messageDispatcher.dispatch(sender, receiver, message, delay, data);
        }

        else {
            YUKA.Logger.warn('Module: Cannot send message to undefined receiver');
        }

        return this;
    }

    update(delta) {

        const modules = this.modules;
        // update modules
        for (const module of modules.values()) {
            module.update(delta);
        }

    }

}

export {
    ModuleBridge,
};
