
const RTD_CONSTANTS = {
    R0: 100,
    A: 3.9083e-3,
    B: -5.775e-7,
    C: -4.183e-12
};

function calculate(R) {
    const { R0, A, B } = RTD_CONSTANTS;
    if (R >= R0) {
        const a = R0 * B;
        const b = R0 * A;
        const c = R0 - R;
        const disc = b * b - 4 * a * c;
        if (disc < 0) return NaN;

        const root1 = (-b - Math.sqrt(disc)) / (2 * a);
        const root2 = (-b + Math.sqrt(disc)) / (2 * a);

        console.log(`R=${R}`);
        console.log(`Root 1 (-): ${root1}`);
        console.log(`Root 2 (+): ${root2}`);
    }
}

calculate(100);
calculate(138.51);
