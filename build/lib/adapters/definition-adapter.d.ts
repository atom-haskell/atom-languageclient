import * as atomIde from 'atom-ide';
import { LanguageClientConnection, Location, ServerCapabilities } from '../languageclient';
import { Point, TextEditor } from 'atom';
export default class DefinitionAdapter {
    static canAdapt(serverCapabilities: ServerCapabilities): boolean;
    getDefinition(connection: LanguageClientConnection, serverCapabilities: ServerCapabilities, languageName: string, editor: TextEditor, point: Point): Promise<atomIde.DefinitionQueryResult | null>;
    static normalizeLocations(locationResult: Location | Location[]): Location[] | null;
    static convertLocationsToDefinitions(locations: Location[], languageName: string): atomIde.Definition[];
}
