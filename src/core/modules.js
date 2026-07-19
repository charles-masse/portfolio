
import * as YUKA from 'yuka';

class ModuleBridge {

    constructor() {

        this._messageDispatcher = new YUKA.MessageDispatcher();

        this.modules = [];

    }

    add(module) {

        this.modules.push(module);

        module.bridge = this;

        return this;
    }

    getModuleByName(name) {

        const module_id = this.modules.map(module => module.constructor.name).indexOf(name);

        if (module_id != -1) {
            return this.modules[module_id];
        }

        return;
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
        for (let i = (modules.length - 1); i >= 0; i--) {
            modules[i].update(delta);
        }

    }

}

export {
    ModuleBridge,
};
