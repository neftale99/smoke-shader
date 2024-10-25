uniform float uTime;
uniform sampler2D uPerlinTexture;
uniform float uAlpha;
varying vec2 vUv;

void main()
{
    // Scale & animate
    vec2 smokeUv = vUv;
    smokeUv.x *= 0.5;
    smokeUv.y *= 0.3;
    smokeUv.y -= uTime * 0.03;

    // Smoke
    float smoke = texture(uPerlinTexture, smokeUv).r;
    smoke = smoothstep(0.4, 1.0, smoke);

    // Edges
    smoke *= smoothstep(0.0, 0.1, vUv.x);
    smoke *= smoothstep(1.0, 0.9, vUv.x);
    smoke *= smoothstep(0.0, 0.1, vUv.y);
    smoke *= smoothstep(1.0, 0.4, vUv.y);

    // Final color
    gl_FragColor = vec4(0.4, 0.4, 0.4, smoke * 2.0 * uAlpha);
    // gl_FragColor = vec4(0.6, 0.3, 0.2, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}