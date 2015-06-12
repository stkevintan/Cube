/**
 * Created by kevin on 15-6-12.
 */
function EntryModel(raw) {
    this.mode = raw.mode;
    this.name = raw.name;
    this.loader = raw.loader || function (callback) {
            callback(null, null);
        }
    this.onadd = raw.onadd || function () {
        }
    this.onremove = raw.onremove || function () {
        }
}
module.exports = EntryModel;