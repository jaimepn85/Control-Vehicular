import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, addDoc, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyD5Ydv-ZB0jFIg3uN_juU66Ers7COa3b2c",
    authDomain: "control-vehicular-42986.firebaseapp.com",
    projectId: "control-vehicular-42986",
    storageBucket: "control-vehicular-42986.firebasestorage.app",
    messagingSenderId: "233831555811",
    appId: "1:233831555811:web:35bb4e83bb379a3cc9dbd6",
    measurementId: "G-27KMXBL70L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Collections
const AUTOS_COLLECTION = "pa_autos";
const PRESTAMOS_COLLECTION = "pa_prestamos";
const PERSONAL_COLLECTION = "pa_personal";
const CONFIG_COLLECTION = "pa_config";

let carsData = [];
let personsData = [];
let dynamicFieldsData = [];

// ==========================================
// NAVIGATION
// ==========================================
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));

        const targetId = e.target.getAttribute('data-target');
        e.target.classList.add('active');
        document.getElementById(targetId).classList.add('active');
    });
});

// ==========================================
// CANVAS SIGNATURE LOGIC
// ==========================================
function setupCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    let x = 0;
    let y = 0;

    // Set background to white
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw settings
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    function getCoordinates(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    const startDrawing = (e) => {
        e.preventDefault();
        isDrawing = true;
        const coords = getCoordinates(e);
        x = coords.x;
        y = coords.y;
    };

    const draw = (e) => {
        if (!isDrawing) return;
        e.preventDefault();
        const coords = getCoordinates(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
        x = coords.x;
        y = coords.y;
    };

    const stopDrawing = (e) => {
        if (isDrawing) {
            e.preventDefault();
            isDrawing = false;
        }
    };

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing, { passive: false });

    return { canvas, ctx };
}

const canvasElabora = setupCanvas('canvas-elabora');
const canvasRecibe = setupCanvas('canvas-recibe');

document.querySelectorAll('.btn-clear').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const canvasId = e.target.getAttribute('data-canvas');
        const canvas = document.getElementById(canvasId);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    });
});

function clearCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// ==========================================
// AUTOS CRUD
// ==========================================

const carForm = document.getElementById('car-form');
const btnCancelCar = document.getElementById('btn-cancel-car');

carForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('car-id').value;
    const data = {
        brand: document.getElementById('car-brand').value,
        model: document.getElementById('car-model').value,
        year: document.getElementById('car-year').value,
        owner: document.getElementById('car-owner').value,
        plate: document.getElementById('car-plate').value,
    };

    try {
        if (id) {
            await setDoc(doc(db, AUTOS_COLLECTION, id), data);
            alert("Vehículo actualizado exitosamente.");
        } else {
            await addDoc(collection(db, AUTOS_COLLECTION), data);
            alert("Vehículo guardado exitosamente.");
        }
        resetCarForm();
    } catch (error) {
        console.error("Error saving car: ", error);
        alert("Error al guardar el vehículo.");
    }
});

function resetCarForm() {
    carForm.reset();
    document.getElementById('car-id').value = '';
    document.getElementById('car-form-title').innerText = "Registrar Nuevo Vehículo";
    btnCancelCar.classList.add('hidden');
}

btnCancelCar.addEventListener('click', resetCarForm);

// Listen to Cars
onSnapshot(collection(db, AUTOS_COLLECTION), (snapshot) => {
    carsData = [];
    const tbody = document.getElementById('cars-table-body');
    const selectCar = document.getElementById('loan-car');

    tbody.innerHTML = '';
    selectCar.innerHTML = '<option value="">Selecciona un vehículo...</option>';

    snapshot.forEach((docSnap) => {
        const car = { id: docSnap.id, ...docSnap.data() };
        carsData.push(car);

        // Table row
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${car.brand} ${car.model}</td>
            <td>${car.plate || 'S/N'}</td>
            <td>${car.year}</td>
            <td>${car.owner}</td>
            <td class="action-btns">
                <button class="btn-edit" onclick="editCar('${car.id}')">Editar</button>
                <button class="btn-delete" onclick="deleteCar('${car.id}')">Borrar</button>
            </td>
        `;
        tbody.appendChild(tr);

        // Select Option
        const opt = document.createElement('option');
        opt.value = car.id;
        opt.textContent = `${car.brand} ${car.model} (${car.plate || car.year})`;
        selectCar.appendChild(opt);
    });
});

window.editCar = (id) => {
    const car = carsData.find(c => c.id === id);
    if (!car) return;

    document.getElementById('car-id').value = car.id;
    document.getElementById('car-brand').value = car.brand;
    document.getElementById('car-model').value = car.model;
    document.getElementById('car-year').value = car.year;
    document.getElementById('car-owner').value = car.owner;
    document.getElementById('car-plate').value = car.plate || '';

    document.getElementById('car-form-title').innerText = "Editar Vehículo";
    btnCancelCar.classList.remove('hidden');

    // Switch to admin tab
    document.querySelector('[data-target="admin-section"]').click();
};

window.deleteCar = async (id) => {
    if (confirm("¿Estás seguro de eliminar este vehículo?")) {
        try {
            await deleteDoc(doc(db, AUTOS_COLLECTION, id));
        } catch (error) {
            console.error("Error deleting car: ", error);
            alert("Error al eliminar el vehículo.");
        }
    }
};

// ==========================================
// PERSONAL CRUD
// ==========================================

const personForm = document.getElementById('person-form');
const btnCancelPerson = document.getElementById('btn-cancel-person');

personForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('person-id').value;
    const data = {
        name: document.getElementById('person-name').value,
    };

    try {
        if (id) {
            await setDoc(doc(db, PERSONAL_COLLECTION, id), data);
            alert("Personal actualizado exitosamente.");
        } else {
            await addDoc(collection(db, PERSONAL_COLLECTION), data);
            alert("Personal guardado exitosamente.");
        }
        resetPersonForm();
    } catch (error) {
        console.error("Error saving person: ", error);
        alert("Error al guardar el personal.");
    }
});

function resetPersonForm() {
    personForm.reset();
    document.getElementById('person-id').value = '';
    document.getElementById('person-form-title').innerText = "Registrar Personal (Elaboradores)";
    btnCancelPerson.classList.add('hidden');
}

btnCancelPerson.addEventListener('click', resetPersonForm);

// Listen to Persons
onSnapshot(collection(db, PERSONAL_COLLECTION), (snapshot) => {
    personsData = [];
    const tbody = document.getElementById('persons-table-body');
    const selectPerson = document.getElementById('loan-elaborador');

    tbody.innerHTML = '';
    selectPerson.innerHTML = '<option value="">Selecciona personal...</option>';

    snapshot.forEach((docSnap) => {
        const person = { id: docSnap.id, ...docSnap.data() };
        personsData.push(person);

        // Table row
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${person.name}</td>
            <td class="action-btns">
                <button class="btn-edit" onclick="editPerson('${person.id}')">Editar</button>
                <button class="btn-delete" onclick="deletePerson('${person.id}')">Borrar</button>
            </td>
        `;
        tbody.appendChild(tr);

        // Select Option
        const opt = document.createElement('option');
        opt.value = person.id;
        opt.textContent = person.name;
        selectPerson.appendChild(opt);
    });
});

window.editPerson = (id) => {
    const person = personsData.find(p => p.id === id);
    if (!person) return;

    document.getElementById('person-id').value = person.id;
    document.getElementById('person-name').value = person.name;

    document.getElementById('person-form-title').innerText = "Editar Personal";
    btnCancelPerson.classList.remove('hidden');

    // Switch to admin tab
    document.querySelector('[data-target="admin-section"]').click();
};

window.deletePerson = async (id) => {
    if (confirm("¿Estás seguro de eliminar esta persona?")) {
        try {
            await deleteDoc(doc(db, PERSONAL_COLLECTION, id));
        } catch (error) {
            console.error("Error deleting person: ", error);
            alert("Error al eliminar persona.");
        }
    }
};

// ==========================================
// DYNAMIC FIELDS CONFIGURATION (ADMIN)
// ==========================================
const dfForm = document.getElementById('dynamic-field-form');
const dfTypeSelect = document.getElementById('df-type');
const dfOptionsGroup = document.getElementById('df-options-group');

dfTypeSelect.addEventListener('change', (e) => {
    if (e.target.value === 'select') {
        dfOptionsGroup.classList.remove('hidden');
        document.getElementById('df-options').required = true;
    } else {
        dfOptionsGroup.classList.add('hidden');
        document.getElementById('df-options').required = false;
    }
});

dfForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const label = document.getElementById('df-label').value;
    const type = document.getElementById('df-type').value;
    const optionsStr = document.getElementById('df-options').value;
    
    // Generate a simple id from label
    const fieldId = 'df_' + label.toLowerCase().replace(/[^a-z0-9]/g, '_');

    const data = {
        id: fieldId,
        label: label,
        type: type,
        options: type === 'select' ? optionsStr.split(',').map(o => o.trim()) : [],
        createdAt: serverTimestamp()
    };

    try {
        await addDoc(collection(db, CONFIG_COLLECTION), data);
        alert("Campo guardado exitosamente.");
        dfForm.reset();
        dfOptionsGroup.classList.add('hidden');
    } catch (error) {
        console.error("Error saving custom field: ", error);
        alert("Error al guardar el campo.");
    }
});

// Listen to Dynamic Fields
onSnapshot(query(collection(db, CONFIG_COLLECTION), orderBy('createdAt', 'asc')), (snapshot) => {
    dynamicFieldsData = [];
    const tbody = document.getElementById('dynamic-fields-table-body');
    const dfContainer = document.getElementById('dynamic-fields-container');
    
    tbody.innerHTML = '';
    dfContainer.innerHTML = '';

    snapshot.forEach((docSnap) => {
        const field = { docId: docSnap.id, ...docSnap.data() };
        dynamicFieldsData.push(field);

        // Render Table Row
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${field.label}</td>
            <td>${field.type === 'select' ? 'Lista Desplegable' : (field.type === 'number' ? 'Número' : 'Texto')}</td>
            <td class="action-btns">
                <button class="btn-delete" onclick="deleteDynamicField('${field.docId}')">Borrar</button>
            </td>
        `;
        tbody.appendChild(tr);

        // Render Field in Loan Form
        const div = document.createElement('div');
        div.className = 'input-group';
        let inputHtml = '';
        if (field.type === 'select') {
            inputHtml = `<select id="${field.id}" required>
                <option value="">Seleccionar...</option>
                ${field.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
            </select>`;
        } else {
            inputHtml = `<input type="${field.type}" id="${field.id}" placeholder="Ingrese ${field.label.toLowerCase()}" required>`;
        }
        
        div.innerHTML = `
            <label for="${field.id}">${field.label}</label>
            ${inputHtml}
        `;
        dfContainer.appendChild(div);
    });
});

window.deleteDynamicField = async (docId) => {
    if (confirm("¿Estás seguro de eliminar este campo dinámico? Los registros pasados lo conservarán pero desaparecerá del formulario nuevo.")) {
        try {
            await deleteDoc(doc(db, CONFIG_COLLECTION, docId));
        } catch (error) {
            console.error("Error deleting custom field: ", error);
        }
    }
};

// ==========================================
// PRESTAMOS LOGIC
// ==========================================

const loanForm = document.getElementById('loan-form');

loanForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const carId = document.getElementById('loan-car').value;
    const carObj = carsData.find(c => c.id === carId);
    if (!carObj) return alert("Selecciona un vehículo válido.");

    const personId = document.getElementById('loan-elaborador').value;
    const personObj = personsData.find(p => p.id === personId);
    if (!personObj) return alert("Selecciona personal válido.");

    // Gather dynamic fields data
    const customData = {};
    dynamicFieldsData.forEach(field => {
        const el = document.getElementById(field.id);
        if (el) {
            customData[field.label] = el.value;
        }
    });

    const sigElabora = canvasElabora.canvas.toDataURL('image/jpeg');
    const sigRecibe = canvasRecibe.canvas.toDataURL('image/jpeg');

    const data = {
        carId: carId,
        carName: `${carObj.brand} ${carObj.model} (${carObj.year})`,
        elaboradorId: personId,
        elaboradorName: personObj.name,
        oficio: document.getElementById('loan-oficio').value,
        driver: document.getElementById('loan-driver').value,
        location: document.getElementById('loan-location').value,
        startDate: document.getElementById('loan-start-date').value,
        endDate: document.getElementById('loan-end-date').value,
        accessories: {
            tarjeta: document.getElementById('acc-tarjeta').checked,
            poliza: document.getElementById('acc-poliza').checked,
            birlo: document.getElementById('acc-birlo').checked,
            llanta: document.getElementById('acc-llanta').checked
        },
        observations: document.getElementById('loan-observations').value,
        customData: customData,
        signatureElabora: sigElabora,
        signatureRecibe: sigRecibe,
        createdAt: serverTimestamp()
    };

    try {
        await addDoc(collection(db, PRESTAMOS_COLLECTION), data);
        alert("Préstamo registrado exitosamente.");
        loanForm.reset();
        
        // Reset dynamic fields explicitly if needed (handled by form.reset() normally)
        document.getElementById('acc-tarjeta').checked = false;
        document.getElementById('acc-poliza').checked = false;
        document.getElementById('acc-birlo').checked = false;
        document.getElementById('acc-llanta').checked = false;

        clearCanvas('canvas-elabora');
        clearCanvas('canvas-recibe');
        // Switch to historial
        document.querySelector('[data-target="historial-section"]').click();
    } catch (error) {
        console.error("Error saving loan: ", error);
        alert("Error al registrar el préstamo.");
    }
});

// Listen to Loans
const qLoans = query(collection(db, PRESTAMOS_COLLECTION), orderBy('createdAt', 'desc'));
let loansData = [];

onSnapshot(qLoans, (snapshot) => {
    loansData = [];
    if (!snapshot.empty) {
        snapshot.forEach((docSnap) => {
            loansData.push({ id: docSnap.id, ...docSnap.data() });
        });
    }
    renderLoans();
});

function renderLoans(filterText = '') {
    const container = document.getElementById('loans-list-container');
    container.innerHTML = '';
    
    const lowerFilter = filterText.toLowerCase();
    const filteredLoans = loansData.filter(loan => {
        return (
            (loan.carName && loan.carName.toLowerCase().includes(lowerFilter)) ||
            (loan.driver && loan.driver.toLowerCase().includes(lowerFilter)) ||
            (loan.location && loan.location.toLowerCase().includes(lowerFilter)) ||
            (loan.oficio && loan.oficio.toLowerCase().includes(lowerFilter))
        );
    });

    if (filteredLoans.length === 0) {
        container.innerHTML = '<div class="loading-text">No hay préstamos que coincidan con la búsqueda.</div>';
        return;
    }

    filteredLoans.forEach((loan) => {
        // Format dates
        const dateStr = loan.startDate ? new Date(loan.startDate).toLocaleString() : 'N/A';

        const div = document.createElement('div');
        div.className = 'loan-card';
        div.innerHTML = `
            <div class="loan-info">
                <h3>${loan.carName}</h3>
                <p><strong>Oficio:</strong> ${loan.oficio || 'N/A'}</p>
                <p><strong>Conductor:</strong> ${loan.driver}</p>
                <p><strong>Comisión:</strong> ${loan.location}</p>
                <p><strong>Salida:</strong> ${dateStr}</p>
            </div>
            <div>
                <button class="btn-primary" onclick="viewLoan('${loan.id}')">Ver Detalles</button>
            </div>
        `;
        container.appendChild(div);
    });
}

document.getElementById('search-loans').addEventListener('input', (e) => {
    renderLoans(e.target.value);
});

// ==========================================
// MODAL LOGIC
// ==========================================
const modal = document.getElementById('loan-modal');
const closeModal = document.querySelector('.close-modal');

closeModal.onclick = () => {
    modal.classList.remove('show');
};

window.onclick = (e) => {
    if (e.target == modal) {
        modal.classList.remove('show');
    }
};

window.viewLoan = (id) => {
    const loan = loansData.find(l => l.id === id);
    if (!loan) return;

    // Llenar metadatos (Oficio y Fecha)
    document.getElementById('print-oficio').innerText = loan.oficio || 'S/N';
    document.getElementById('print-fecha-emision').innerText = new Date(loan.createdAt?.toDate() || Date.now()).toLocaleDateString();

    // Llenar Tabla de Datos
    const tabla = document.getElementById('print-tabla-datos');
    
    // Construir string de accesorios
    const accTexts = [];
    if (loan.accessories) {
        if (loan.accessories.tarjeta) accTexts.push("Tarjeta de circulación");
        if (loan.accessories.poliza) accTexts.push("Póliza de seguro");
        if (loan.accessories.birlo) accTexts.push("Birlo de seguridad");
        if (loan.accessories.llanta) accTexts.push("Llanta de refacción y hta.");
    }
    const accString = accTexts.length > 0 ? accTexts.join(", ") : "Ninguno";

    let tablaHtml = `
        <tr><th>Vehículo:</th><td>${loan.carName}</td></tr>
        <tr><th>Conductor:</th><td>${loan.driver}</td></tr>
        <tr><th>Destino / Lugar:</th><td>${loan.location}</td></tr>
        <tr><th>Salida:</th><td>${new Date(loan.startDate).toLocaleString()}</td></tr>
        <tr><th>Regreso:</th><td>${new Date(loan.endDate).toLocaleString()}</td></tr>
        <tr><th>Kilometraje Inicial:</th><td>${loan.mileage || 'N/A'} km</td></tr>
        <tr><th>Gasolina:</th><td>${loan.gas || 'N/A'}</td></tr>
        <tr><th>Accesorios:</th><td>${accString}</td></tr>
    `;

    // Campos Dinámicos
    if (loan.customData) {
        for (const [key, value] of Object.entries(loan.customData)) {
            tablaHtml += `<tr><th>${key}:</th><td>${value || 'N/A'}</td></tr>`;
        }
    }

    // Observaciones siempre al final
    tablaHtml += `<tr><th>Observaciones:</th><td>${loan.observations || 'Ninguna'}</td></tr>`;
    
    tabla.innerHTML = tablaHtml;

    // Firmas
    document.getElementById('print-sig-elabora').src = loan.signatureElabora;
    document.getElementById('print-name-elabora').innerText = loan.elaboradorName || 'No especificado';
    
    document.getElementById('print-sig-recibe').src = loan.signatureRecibe;
    document.getElementById('print-name-recibe').innerText = loan.driver;

    modal.classList.add('show');
};

// ==========================================
// IMPORTACIÓN TEMPORAL DE AUTOS DESDE JSON
// ==========================================
const btnImportCars = document.getElementById('btn-import-cars');
if (btnImportCars) {
    btnImportCars.addEventListener('click', async () => {
        const autosJson = [
            { "activo": true, "anio": 2003, "marca": "Chevrolet", "modelo": "Chevy", "placa": "PHR-112-C", "resguardos": "Dra. Mariana Gudiño", "serie": "3G1SF616235216287", "estatus": "Inactivo" },
            { "activo": true, "anio": 2024, "marca": "Nissan", "modelo": "Frontier", "placa": "NR7-126-C", "resguardos": "Maricela Ventura Díaz", "serie": "3N6AD33A0RK844279", "estatus": "Activo" },
            { "activo": true, "anio": 2023, "marca": "Nissan", "modelo": "Sentra", "placa": "PHR-874-C", "resguardos": "Mtra. Sofía Beltrán Pacheco", "serie": "3N1AB8AEXPY201379", "estatus": "Activo" },
            { "activo": true, "anio": 2000, "marca": "Nissan", "modelo": "Doble cabina", "placa": "NA1-667-A", "resguardos": "Lic. Gerardo Ortiz Arévalo", "serie": "3N6CD13S4YK026641", "estatus": "Activo" },
            { "activo": true, "anio": 2009, "marca": "Ford", "modelo": "F150", "placa": "NA1-664-A", "resguardos": "Dra. Mariana Gudiño", "serie": "3FTRF17239MA07571", "estatus": "Activo" },
            { "activo": true, "anio": 2025, "marca": "Nissan", "modelo": "Sentra", "placa": "PLX-944-E", "resguardos": "Dra Mariana Gudiño Paredes", "serie": "3N1AB8A6SY389293", "estatus": "Activo" },
            { "activo": true, "anio": 2017, "marca": "Dodge", "modelo": "Attitude", "placa": "PHT-120-C", "resguardos": "L.A. Sandra Ivonne Vargas", "serie": "ML3AB26J6HH020795", "estatus": "Activo" },
            { "activo": true, "anio": 2023, "marca": "Nissan", "modelo": "Sentra", "placa": "PLV-996-D", "resguardos": "Dra. Mariana Gudiño", "serie": "3N1AB8AE1PY330255", "estatus": "Activo" },
            { "activo": true, "anio": 2009, "marca": "Mazda", "modelo": "M3I", "placa": "PHT-110-C", "resguardos": "Lic. Marco Polo Santoyo", "serie": "JM1BK12FX91226337", "estatus": "Activo" },
            { "activo": true, "anio": 2011, "marca": "Nissan", "modelo": "Tsuru GSI", "placa": "PHR-119-C", "resguardos": "C. Abel Cárdenas", "serie": "3N1EB31S5BK352961", "estatus": "Activo" },
            { "activo": true, "anio": 2003, "marca": "Ford", "modelo": "Ranger", "placa": "NA4-551-A", "resguardos": "L.A. Sandra Ivonne Vargas", "serie": "8AFDT52D136281600", "estatus": "Activo" },
            { "activo": true, "anio": 2011, "marca": "Nissan", "modelo": "Tsuru GSI", "placa": "PHR-120-C", "resguardos": "Lic. Ma. Guadalupe Arroyo", "serie": "3N1EB31S3BK344874", "estatus": "Activo" },
            { "activo": true, "anio": 2020, "marca": "Ford", "modelo": "Ranger Comodato", "placa": "ND1-438--", "resguardos": "Jennifer", "serie": "AFAHR6CA0LP111391", "estatus": "Activo" },
            { "activo": true, "anio": 2008, "marca": "Chevrolet", "modelo": "Express Van", "placa": "PHR-116-C", "resguardos": "L.A. Sandra Ivonne Vargas", "serie": "1GAHG39K781203373", "estatus": "Activo" },
            { "activo": true, "anio": 2023, "marca": "Nissan", "modelo": "Sentra", "placa": "PLV-997-D", "resguardos": "Lic. Laura Yunuen Mejía", "serie": "3N1AB8AEXPY330786", "estatus": "Activo" },
            { "activo": true, "anio": 2001, "marca": "Ford", "modelo": "F150", "placa": "NA1-654-A", "resguardos": "Lic. Gerardo Ortiz Arévalo", "serie": "3FTDF17221MA41483", "estatus": "Inactivo" },
            { "activo": true, "anio": 2024, "marca": "Nissan", "modelo": "Frontier", "placa": "NR7-127-C", "resguardos": "Christian Pantoja Farfán", "serie": "3N6AD33A3RK844275", "estatus": "Activo" },
            { "activo": true, "anio": 2003, "marca": "Ford", "modelo": "Ranger", "placa": "NA1-655-A", "resguardos": "L.A. Sandra Ivonne Vargas", "serie": "8AFDT52D236281590", "estatus": "Activo" },
            { "activo": true, "anio": 2023, "marca": "Nissan", "modelo": "Sentra", "placa": "ND1-438-A", "resguardos": "Prevision Social", "serie": "000000", "estatus": "Activo" },
            { "activo": true, "anio": 2023, "marca": "Nissan", "modelo": "Sentra", "placa": "PHS-801-C", "resguardos": "Lic. Alejandra López Mariscal", "serie": "3N1AB8AE5PY201872", "estatus": "Activo" },
            { "activo": true, "anio": 2024, "marca": "Nissan", "modelo": "Frontier", "placa": "NR7-128-C", "resguardos": "Oscar Solorio Torres", "serie": "3N6AD33A1RK844274", "estatus": "Activo" },
            { "activo": true, "anio": 2023, "marca": "Nissan", "modelo": "Sentra", "placa": "PHS-805-C", "resguardos": "L.C. José Carrillo García", "serie": "3N1AB8AE0PY201410", "estatus": "Activo" },
            { "activo": true, "anio": 2009, "marca": "Chevrolet", "modelo": "Suburban", "placa": "PHT-116-C", "resguardos": "R. Materiales Enrique Hernández", "serie": "1GNFC16J79R131126", "estatus": "Inactivo" },
            { "activo": true, "anio": 2009, "marca": "Ford", "modelo": "F150", "placa": "NA4-552-A", "resguardos": "Lic. Gerardo Ortiz Arévalo", "serie": "3FTRF17229MA07562", "estatus": "Activo" },
            { "activo": true, "anio": 2009, "marca": "Ford", "modelo": "Ranger", "placa": "NA4-555-A", "resguardos": "Dra. Mariana Gudiño", "serie": "8AFDT50D996203500", "estatus": "Inactivo" },
            { "activo": true, "anio": 2017, "marca": "DODGE", "modelo": "Attitude", "placa": "PLX-845-E", "resguardos": "Christian Sandoval", "serie": "ML3AB26J8HH021043", "estatus": "Activo" },
            { "activo": true, "anio": 2009, "marca": "Nissan", "modelo": "Sentra", "placa": "PHT-114-C", "resguardos": "José Cárdenas Mendiola", "serie": "3N1AB61D49L605791", "estatus": "Activo" },
            { "activo": true, "anio": 2011, "marca": "Nissan", "modelo": "Tsuru GSI", "placa": "PHR-118-C", "resguardos": "S. PARTICULAR Guillermo Espinosa", "serie": "3N1EB31S2BK352674", "estatus": "Inactivo" },
            { "activo": true, "anio": 2025, "marca": "Nissan", "modelo": "Sentra", "placa": "PLX-943-E", "resguardos": "Dra Mariana Gudiño Paredes", "serie": "3N1AB8AE4SY390166", "estatus": "Activo" },
            { "activo": true, "anio": 2023, "marca": "Nissan", "modelo": "Sentra", "placa": "PHR-280-C", "resguardos": "Gloria Huerta", "serie": "3N1AB8AE3PY201787", "estatus": "Activo" },
            { "activo": true, "anio": 2020, "marca": "Chevrolet", "modelo": "Aveo Comodato", "placa": "PTB-939-A", "resguardos": "Fernando Diaz Barriga", "serie": "LSGHD52H9LD080083", "estatus": "Activo" },
            { "activo": true, "anio": 2023, "marca": "Nissan", "modelo": "Sentra", "placa": "PPS-244-D", "resguardos": "Mtro. Eduardo Norberto Ramírez Caanals", "serie": "3N1AB8AE4PY330461", "estatus": "Activo" },
            { "activo": true, "anio": 2023, "marca": "Hyundai", "modelo": "Palisade", "placa": "PKJ-375-D", "resguardos": "Lic. Claudio Méndez Fernández", "serie": "KM8R64GE8PU570292", "estatus": "Activo" },
            { "activo": true, "anio": 2008, "marca": "Faw", "modelo": "F5HL", "placa": "PHT-113-C", "resguardos": "CCAPS Lic. Morelia Fuentes", "serie": "LFP73APB785D01661", "estatus": "Activo" },
            { "activo": true, "anio": 2023, "marca": "Nissan", "modelo": "Sentra", "placa": "PLV-998-D", "resguardos": "Arq. Ruggiero Zepeda", "serie": "3N1AB8AE6PY329473", "estatus": "Activo" },
            { "activo": true, "anio": 2017, "marca": "Dodge", "modelo": "Attitude", "placa": "PHT-119-C", "resguardos": "L.A. Sandra Ivonne Vargas", "serie": "ML3AB26J6HH020540", "estatus": "Activo" },
            { "activo": true, "anio": 2009, "marca": "Ford", "modelo": "F150", "placa": "NA4-552-A", "resguardos": "Lic. Gerardo Ortiz Arévalo", "serie": "3FTRF17229MA07562", "estatus": "Activo" },
            { "activo": true, "anio": 2011, "marca": "Nissan", "modelo": "Tsuru GSI", "placa": "PHR-115-C", "resguardos": "L.A. Sandra Ivonne Vargas", "serie": "3N1EB31S7BK352606", "estatus": "Activo" },
            { "activo": true, "anio": 2011, "marca": "Nissan", "modelo": "Tsuru GSI", "placa": "PHT-117-C", "resguardos": "ZAMORA SNE Lic. Juan P. Puebla", "serie": "3N1EB31S1BK345215", "estatus": "Inactivo" },
            { "activo": true, "anio": 2009, "marca": "Mitsubishi", "modelo": "Montero", "placa": "PHR-113-C", "resguardos": "R. Materiales Enrique Hernández", "serie": "MMEMC71N09F005377", "estatus": "Inactivo" }
        ];

        if (!confirm(`¿Deseas importar ${autosJson.length} vehículos a tu base de datos?`)) return;

        try {
            btnImportCars.disabled = true;
            btnImportCars.innerText = "Importando...";
            for (const auto of autosJson) {
                const data = {
                    brand: auto.marca,
                    model: auto.modelo,
                    year: auto.anio,
                    owner: auto.resguardos,
                    plate: auto.placa,
                    serie: auto.serie || "",
                    estatus: auto.estatus || "Activo"
                };
                await addDoc(collection(db, AUTOS_COLLECTION), data);
            }
            alert("✅ ¡Todos los autos han sido importados con éxito a Firebase!");
            btnImportCars.style.display = 'none'; // Lo ocultamos porque ya no se necesita
        } catch (e) {
            console.error(e);
            alert("❌ Ocurrió un error: " + e.message);
        } finally {
            btnImportCars.disabled = false;
            btnImportCars.innerText = "📥 Importar Autos (JSON)";
        }
    });
}
