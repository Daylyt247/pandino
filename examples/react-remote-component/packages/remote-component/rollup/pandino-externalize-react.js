import { EOL } from 'os';
import { minify as terserMinify } from "terser";

const providerTemplate = (componentMap) => {
  const props = typeof componentMap.props === 'object' ? JSON.stringify(componentMap.props) : '{}';

  return `
        const provide${componentMap.component} = {
            getComponent: () => ${componentMap.component},
            getFilter: () => undefined,
            getIdentifier: () => '${componentMap.identifier}',
        };
        this.provide${componentMap.component}Registration = context.registerService(provide${componentMap.component}.getIdentifier(), provide${componentMap.component}, ${props});
  `
};

const externalRefsTemplate = ({token, identifier}) => {
  return `
        this.${token}Ref = context.getServiceReference('${identifier}');
        const ${token} = context.getService(this.${token}Ref);  
  `;
};

const template = (componentsMap, externalRefsMap, codes) => `
class Activator {
    jsxsRef
    jsxRef
    FragmentRef
    useStateRef
    ${componentsMap.map(m => `provide${m.component}Registration`).join(EOL)}
    start(context) {
        /**** External Refs ****/
        ${externalRefsMap.map(externalRefsTemplate).join(EOL)}
        
        /**** Components ****/
        ${codes.join(EOL)}
        
        /**** Register Providers ****/
        ${componentsMap.map(providerTemplate).join(EOL)}

        return Promise.resolve();
    }
    stop(context) {
        ${externalRefsMap.map(m => `context.ungetService(this.${m.token}Ref);`).join(EOL)}
        ${componentsMap.map(m => `this.provide${m.component}Registration?.unregister();`).join(EOL)}
        return Promise.resolve();
    }
}

export { Activator as default };

`;

export const pandinoExternalizeReact = ({ componentsMap = {}, externalRefsMap = {}, minify = false }) => {
  const codes = [];

  return {
    name: 'pandino-externalize-react',
    renderChunk: async (code, chunk, options) => {
      for (module of Object.values(chunk.modules)) {
        if (module.code && (module.code.startsWith('function') || module.code.startsWith('class'))) {
          codes.push(module.code);
        }
      }
    },
    generateBundle: async (options, bundle, isWrite) => {
      const key = Object.keys(bundle)[0];
      const result = template(componentsMap, externalRefsMap, codes);
      bundle[key].code = minify ? (await terserMinify(result)).code : result;
    },
  }
}
