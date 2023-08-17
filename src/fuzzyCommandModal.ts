import { App } from "obsidian";
import { FuzzyModal, MatchData, PinyinIndex as PI, Pinyin } from "./fuzzyModal";
import Fuzyy_chinese from "./main";

type Item = {
    name: string;
    pinyin: Pinyin<Item>;
    command: any;
};

export class FuzzyCommandModal extends FuzzyModal<Item> {
    constructor(app: App, plugin: Fuzyy_chinese) {
        super(app, plugin);
        this.index = this.plugin.addChild(new PinyinIndex(this.app, this.plugin));
        this.emptyStateText = "未发现命令。";
        this.setPlaceholder("输入命令……");
        let prompt = [
            {
                command: "↵",
                purpose: "使用",
            },
            {
                command: "esc",
                purpose: "退出",
            },
        ];
        this.setInstructions(prompt);
    }
    onOpen() {
        super.onOpen();
        this.index.update();
    }
    getEmptyInputSuggestions(): MatchData<Item>[] {
        return this.index.items.slice(0, 100).map((p) => {
            return { item: p, score: 0, range: null };
        });
    }
    onChooseSuggestion(matchData: MatchData<Item>, evt: MouseEvent | KeyboardEvent) {
        app.commands.executeCommand(matchData.item.command);
    }
}
class PinyinIndex extends PI<Item> {
    constructor(app: App, plugin: Fuzyy_chinese) {
        super(app, plugin);
    }
    initEvent() {}
    initIndex() {
        let commands = app.commands.listCommands();
        this.items = commands.map((command) => {
            let item = {
                name: command.name,
                pinyin: new Pinyin(command.name, this.plugin),
                command: command,
            };
            return item;
        });
    }
    update() {
        let commands = app.commands.listCommands();
        let oldCommandsNames = this.items.map((item) => item.name);
        let newCommandsNames = commands.map((command) => command.name);
        let addedCommands = newCommandsNames.filter((command) => !oldCommandsNames.includes(command));
        let removedCommands = oldCommandsNames.filter((command) => !newCommandsNames.includes(command));
        if (addedCommands.length > 0) {
            // 添加新命令
            this.items.push(
                ...addedCommands.map((command) => {
                    let item = {
                        name: command,
                        pinyin: new Pinyin(command, this.plugin),
                        command: commands.find((p) => p.name == command),
                    };
                    return item;
                })
            );
        }
        if (removedCommands.length > 0) {
            // 删除旧命令
            this.items = this.items.filter((item) => !removedCommands.includes(item.name));
        }
    }
}