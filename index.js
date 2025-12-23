import lodash from 'https://cdn.jsdelivr.net/npm/lodash@4.17.21/+esm'
const _shuffle = lodash._.shuffle
const _merge = lodash._.merge
const _difference = lodash._.difference
const _cloneDeep = lodash._.cloneDeep
import * as utils from './utils.js';
import { defaultSettings } from './defaultsettings.js';

export default class WordSearch {
	constructor(options = {}) {
		this.settings = _merge(_cloneDeep(defaultSettings), _cloneDeep(options));
		this.settings.allowedDirections = _difference(
			this.settings.allowedDirections,
			this.settings.disabledDirections
		);
		this.forbiddenWordsFound = [];
		this.data = this.buildGame();
	}
	get grid() {
		return _cloneDeep(this.data.grid);
	}
	get words() {
		return _cloneDeep(this.data.words);
	}
	get cleanForbiddenWords() {
		return _cloneDeep(this.settings.forbiddenWords).map(w => this.cleanWord(w));
	}
	get forbiddenWordsIncluded() {
		return _cloneDeep(this.forbiddenWordsFound);
	}
	get defaultSettings() {
		return _cloneDeep(defaultSettings);
	}
	get utils() {
		return utils;
	}
	buildGame(retries = 0) {
		let grid = utils.createGrid(this.settings.cols, this.settings.rows);
		const addedWords = [];
		const dict = _shuffle(this.settings.dictionary);
		dict.forEach(word => {
			const clean = this.cleanWord(word);
			if (this.cleanForbiddenWords.some(fw => clean.includes(fw))) {
				return;
			}
			if (addedWords.length < this.settings.maxWords) {
				const path = utils.findPathInGrid(
					clean,
					grid,
					this.settings.allowedDirections,
					this.settings.backwardsProbability
				);
				if (path !== false) {
					grid = utils.addWordToGrid(clean, path, grid);
					addedWords.push({ word, clean, path });
				}
			}
		});
		addedWords.sort((a, b) => (a.clean > b.clean ? 1 : -1));
		grid = utils.fillGrid(grid, this.settings.upperCase, this.settings.alphabet);

		if (this.cleanForbiddenWords.length) {
			const forbiddenWordsFound = utils.filterWordsInGrid(this.cleanForbiddenWords, grid);
			if (forbiddenWordsFound.length) {
				if (retries < this.settings.maxRetries) {
					return this.buildGame(retries + 1);
				} else {
					// Too many retries, we output the grid even
					// if it contains forbidden words, after populating
					// this to let the developer see which ones:
					this.forbiddenWordsFound = forbiddenWordsFound;
				}
			}
		}

		return { grid, words: addedWords };
	}
	cleanWord(word) {
		return utils.normalizeWord(
			word,
			this.settings.upperCase
		);
	}
	dump() {
		return _cloneDeep({ settings: this.settings, data: this.data });
	}
	load(config) {
		_merge(this, config);
		return this;
	}
	read(start, end) {
		const path = utils.createPathFromPair(start, end);
		if (path) {
			return path.map(pos => this.data.grid[pos.y][pos.x]).join("");
		}
		return null;
	}
	toString() {
		return this.data.grid.map(l => l.join(" ")).join("\n");
	}
}