
import * as THREE from 'three';

import * as YUKA from 'yuka';

class NavMesh extends YUKA.NavMesh {

    constructor() {
        super();

        this.triangles = null;
        this.perimeter = null;

    }

    fromPolygons(polygons) {
        super.fromPolygons(polygons);

        this.triangulate();
        this.calculatePerimeter();

        return this;
    }

    triangulate() {

        const triangulated = [];

        for (const region of this.regions) {

            const contour = [];
            region.getContour(contour);

            const contour_2d = contour.map(p => new THREE.Vector2(p.x, p.z));

            const triangles = THREE.ShapeUtils.triangulateShape(contour_2d, [])
            const triangles_points = triangles.map(tri => tri.map(idx => contour_2d[idx]));

            triangulated.push(...triangles_points);

        }

        this.triangles = triangulated;

    }

    calculatePerimeter() {

        const perimeter = [];

        for (const region of this.regions) {

            const contour = [];
            region.getContour(contour);

            for (let i=0; i < contour.length; i++) {

                const wall = new YUKA.LineSegment(contour[i], contour[(i + 1) % contour.length]);
                wall.normal = wall.to.clone().sub(wall.from).cross(new YUKA.Vector3(0, 1, 0)).multiplyScalar(-1.0).normalize();

                perimeter.push(wall);

            }

        }

        let final_perimeter = perimeter.slice();

        for (let e=0; e < perimeter.length; e++) {
            for (let i=0; i < perimeter.length; i++) {

                if (i != e) {

                    const distances = [
                        perimeter[e].from.clone().sub(perimeter[i].from).length(),
                        perimeter[e].from.clone().sub(perimeter[i].to).length(),
                        perimeter[e].to.clone().sub(perimeter[i].to).length(),
                        perimeter[e].to.clone().sub(perimeter[i].from).length(),
                    ]

                    if (distances.filter(v => v === 0).length == 2) {
                        final_perimeter.splice(final_perimeter.indexOf(perimeter[i]), 1);
                    }
                    
                }

            }

        }

        this.perimeter = final_perimeter;

    }

    randomPoint() {
        //TODO add underscan to prevent agents from spawning inside walls
        const triangles = this.triangles;
        const tri = triangles[THREE.MathUtils.randInt(0, triangles.length - 1)];

        let r1 = Math.random();
        let r2 = Math.random();

        if (r1 + r2 > 1) {
            r1 = 1 - r1; r2 = 1 - r2;
        };

        return {
            x: tri[0].x + r1 * (tri[1].x - tri[0].x) + r2 * (tri[2].x - tri[0].x),
            y: tri[0].y + r1 * (tri[1].y - tri[0].y) + r2 * (tri[2].y - tri[0].y)
        };
    }

}

function extractUrlBase( url = '' ) {

    const index = url.lastIndexOf( '/' );

    if ( index === - 1 ) return './';

    return url.substr( 0, index + 1 );

}

function resolveURI( uri, path ) {

    if ( typeof uri !== 'string' || uri === '' ) return '';

    if ( /^(https?:)?\/\//i.test( uri ) ) return uri;

    if ( /^data:.*,.*$/i.test( uri ) ) return uri;

    if ( /^blob:.*$/i.test( uri ) ) return uri;

    return path + uri;

}

//

const WEBGL_TYPE_SIZES = {
    'SCALAR': 1,
    'VEC2': 2,
    'VEC3': 3,
    'VEC4': 4,
    'MAT2': 4,
    'MAT3': 9,
    'MAT4': 16
};

const WEBGL_COMPONENT_TYPES = {
    5120: Int8Array,
    5121: Uint8Array,
    5122: Int16Array,
    5123: Uint16Array,
    5125: Uint32Array,
    5126: Float32Array
};

const BINARY_EXTENSION_HEADER_MAGIC = 'glTF';
const BINARY_EXTENSION_HEADER_LENGTH = 12;
const BINARY_EXTENSION_CHUNK_TYPES = { JSON: 0x4E4F534A, BIN: 0x004E4942 };

class NavMeshLoader extends YUKA.NavMeshLoader {

    parse(arrayBuffer, url, options) {

        const parser = new Parser();
        const decoder = new TextDecoder();
        let data;

        const magic = decoder.decode(new Uint8Array(arrayBuffer, 0, 4));

        if (magic === BINARY_EXTENSION_HEADER_MAGIC) {

            parser.parseBinary(arrayBuffer);

            data = parser.extensions.get('BINARY').content;

        } else {

            data = decoder.decode(new Uint8Array(arrayBuffer));

        }

        const json = JSON.parse(data);

        if (json.asset === undefined || json.asset.version[ 0 ] < 2) {

            throw new Error('YUKA.NavMeshLoader: Unsupported asset version.');

        } else {

            const path = extractUrlBase(url);

            return parser.parse(json, path, options);
        }

    }

}

class Parser {

    constructor() {

        this.json = null;
        this.path = null;
        this.cache = new Map();
        this.extensions = new Map();

    }

    parse( json, path, options ) {

        this.json = json;
        this.path = path;

        // read the first mesh in the glTF file

        return this.getDependency( 'mesh', 0 ).then( ( data ) => {

            // parse the raw geometry data into a bunch of polygons

            const polygons = this.parseGeometry( data );

            // create and config navMesh

            const navMesh = new NavMesh();

            if ( options ) {

                if ( options.epsilonCoplanarTest !== undefined ) navMesh.epsilonCoplanarTest = options.epsilonCoplanarTest;
                if ( options.mergeConvexRegions !== undefined ) navMesh.mergeConvexRegions = options.mergeConvexRegions;

            }

            // use polygons to setup the nav mesh

            return navMesh.fromPolygons( polygons );

        } );

    }

    parseGeometry( data ) {

        const index = data.index;
        const position = data.position;

        const vertices = new Array();
        const polygons = new Array();

        // vertices

        for ( let i = 0, l = position.length; i < l; i += 3 ) {

            const v = new YUKA.Vector3();

            v.x = position[ i + 0 ];
            v.y = position[ i + 1 ];
            v.z = position[ i + 2 ];

            vertices.push( v );

        }

        // polygons

        if ( index ) {

            // indexed geometry

            for ( let i = 0, l = index.length; i < l; i += 3 ) {

                const a = index[ i + 0 ];
                const b = index[ i + 1 ];
                const c = index[ i + 2 ];

                const contour = [ vertices[ a ], vertices[ b ], vertices[ c ] ];

                const polygon = new YUKA.Polygon().fromContour( contour );

                polygons.push( polygon );

            }

        } else {

            // non-indexed geometry //todo test

            for ( let i = 0, l = vertices.length; i < l; i += 3 ) {

                const contour = [ vertices[ i + 0 ], vertices[ i + 1 ], vertices[ i + 2 ] ];

                const polygon = new Polygon().fromContour( contour );

                polygons.push( polygon );

            }

        }

        return polygons;

    }

    getDependencies( type ) {

        const cache = this.cache;

        let dependencies = cache.get( type );

        if ( ! dependencies ) {

            const definitions = this.json[ type + ( type === 'mesh' ? 'es' : 's' ) ] || new Array();

            dependencies = Promise.all( definitions.map( ( definition, index ) => {

                return this.getDependency( type, index );

            } ) );

            cache.set( type, dependencies );

        }

        return dependencies;

    }

    getDependency( type, index ) {

        const cache = this.cache;
        const key = type + ':' + index;

        let dependency = cache.get( key );

        if ( dependency === undefined ) {

            switch ( type ) {

                case 'accessor':
                    dependency = this.loadAccessor( index );
                    break;

                case 'buffer':
                    dependency = this.loadBuffer( index );
                    break;

                case 'bufferView':
                    dependency = this.loadBufferView( index );
                    break;

                case 'mesh':
                    dependency = this.loadMesh( index );
                    break;

                default:
                    throw new Error( 'Unknown type: ' + type );

            }

            cache.set( key, dependency );

        }

        return dependency;

    }

    loadBuffer( index ) {

        const json = this.json;
        const definition = json.buffers[ index ];

        if ( definition.uri === undefined && index === 0 ) {

            return Promise.resolve( this.extensions.get( 'BINARY' ).body );

        }

        return new Promise( ( resolve, reject ) => {

            const url = resolveURI( definition.uri, this.path );

            fetch( url )

                .then( response => {

                    return response.arrayBuffer();

                } )

                .then( ( arrayBuffer ) => {

                    resolve( arrayBuffer );

                } ).catch( ( error ) => {

                    Logger.error( 'YUKA.NavMeshLoader: Unable to load buffer.', error );

                    reject( error );

                } );

        } );

    }

    loadBufferView( index ) {

        const json = this.json;

        const definition = json.bufferViews[ index ];

        return this.getDependency( 'buffer', definition.buffer ).then( ( buffer ) => {

            const byteLength = definition.byteLength || 0;
            const byteOffset = definition.byteOffset || 0;
            return buffer.slice( byteOffset, byteOffset + byteLength );

        } );

    }

    loadAccessor( index ) {

        const json = this.json;
        const definition = json.accessors[ index ];

        return this.getDependency( 'bufferView', definition.bufferView ).then( ( bufferView ) => {

            const itemSize = WEBGL_TYPE_SIZES[ definition.type ];
            const TypedArray = WEBGL_COMPONENT_TYPES[ definition.componentType ];
            const byteOffset = definition.byteOffset || 0;

            return new TypedArray( bufferView, byteOffset, definition.count * itemSize );

        } );

    }

    loadMesh( index ) {

        const json = this.json;
        const definition = json.meshes[ index ];

        return this.getDependencies( 'accessor' ).then( ( accessors ) => {

            // assuming a single primitive

            const primitive = definition.primitives[ 0 ];

            if ( primitive.mode !== undefined && primitive.mode !== 4 ) {

                throw new Error( 'YUKA.NavMeshLoader: Invalid geometry format. Please ensure to represent your geometry as triangles.' );

            }

            return {
                index: accessors[ primitive.indices ],
                position: accessors[ primitive.attributes.POSITION ],
                normal: accessors[ primitive.attributes.NORMAL ]
            };

        } );

    }

    parseBinary( data ) {

        const chunkView = new DataView( data, BINARY_EXTENSION_HEADER_LENGTH );
        let chunkIndex = 0;

        const decoder = new TextDecoder();
        let content = null;
        let body = null;

        while ( chunkIndex < chunkView.byteLength ) {

            const chunkLength = chunkView.getUint32( chunkIndex, true );
            chunkIndex += 4;

            const chunkType = chunkView.getUint32( chunkIndex, true );
            chunkIndex += 4;

            if ( chunkType === BINARY_EXTENSION_CHUNK_TYPES.JSON ) {

                const contentArray = new Uint8Array( data, BINARY_EXTENSION_HEADER_LENGTH + chunkIndex, chunkLength );
                content = decoder.decode( contentArray );

            } else if ( chunkType === BINARY_EXTENSION_CHUNK_TYPES.BIN ) {

                const byteOffset = BINARY_EXTENSION_HEADER_LENGTH + chunkIndex;
                body = data.slice( byteOffset, byteOffset + chunkLength );

            }

            chunkIndex += chunkLength;

        }

        this.extensions.set( 'BINARY', { content: content, body: body } );

    }

}

export {
    NavMeshLoader,
};