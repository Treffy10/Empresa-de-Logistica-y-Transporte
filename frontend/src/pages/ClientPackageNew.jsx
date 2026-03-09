import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createClientPackage,
  listClients,
  listBranches,
  getUser,
  createClient,
  getDniData
} from "../services/api.js";
import PhoneField from "../components/PhoneField.jsx";
import { DEFAULT_PHONE_COUNTRY, onlyDigits } from "../utils/phone.js";

const ClientPackageNew = () => {

  const navigate = useNavigate();
  const user = getUser();

  const backgroundImages = [
    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=1920&auto=format&fit=crop"
  ];

  const [bgIndex,setBgIndex] = useState(0);

  const [clients,setClients] = useState([]);
  const [branches,setBranches] = useState([]);

  const [form,setForm] = useState({
    destinatarioId:"",
    sucursalOrigenId:"",
    destinoTexto:"",
    descripcion:"",
    pesoKg:"",
    quienPaga:"remitente"
  });

  const [error,setError] = useState("");
  const [loading,setLoading] = useState(false);

  const [showNewClient,setShowNewClient] = useState(false);

  const [newClient,setNewClient] = useState({
    tipoDocumento:"dni",
    documento:"",
    nombre:"",
    telefonoPais:DEFAULT_PHONE_COUNTRY,
    telefonoNumero:"",
    email:"",
    direccion:""
  });

  const [newClientError,setNewClientError] = useState("");
  const [newClientLoading,setNewClientLoading] = useState(false);

  const [dniLoading,setDniLoading] = useState(false);
  const [dniError,setDniError] = useState("");

  const lastDniQueriedRef = useRef("");

  useEffect(()=>{
    const interval=setInterval(()=>{
      setBgIndex(prev=>(prev+1)%backgroundImages.length);
    },6000);

    return ()=>clearInterval(interval);
  },[]);

  const loadData = async () => {

    try{

      const [clientsData,branchesData] = await Promise.all([
        listClients(),
        listBranches()
      ]);

      const myId = String(user?.clienteId || "");

      setClients(clientsData.filter(c=>String(c.id)!==myId));
      setBranches(branchesData);

    }catch(err){
      setError(err.message || "No se pudieron cargar los datos.");
    }

  };

  useEffect(()=>{ loadData(); },[]);

  useEffect(()=>{

    if(!showNewClient || newClient.tipoDocumento!=="dni") return;

    const dni = onlyDigits(newClient.documento);

    if(dni.length!==8 || dni===lastDniQueriedRef.current) return;

    let cancelled=false;

    const timer=setTimeout(async()=>{

      setDniLoading(true);
      setDniError("");

      try{

        const result = await getDniData(dni);

        if(cancelled) return;

        const fullName =
          String(result.nombreCompleto || "").trim() ||
          [result.nombres,result.apellidoPaterno,result.apellidoMaterno]
          .filter(Boolean)
          .join(" ");

        setNewClient(prev=>({
          ...prev,
          documento:dni,
          nombre:fullName || prev.nombre
        }));

        lastDniQueriedRef.current = dni;

      }catch(err){

        if(!cancelled){
          setDniError("No se pudo consultar. Completa el nombre manualmente.");
        }

      }finally{

        if(!cancelled) setDniLoading(false);

      }

    },400);

    return ()=>{
      cancelled=true;
      clearTimeout(timer);
    }

  },[showNewClient,newClient.documento,newClient.tipoDocumento]);

  const handleChange=(e)=>{

    const {name,value}=e.target;

    setForm(prev=>({...prev,[name]:value}));

    if(name==="destinatarioId" && value){

      const client=clients.find(c=>String(c.id)===String(value));

      if(client?.direccion){
        setForm(prev=>({...prev,destinoTexto:client.direccion}));
      }

    }

  };

  const handleNewClientChange=(e)=>{

    const {name,value}=e.target;

    const nextValue=name==="documento"?onlyDigits(value):value;

    setNewClient(prev=>({...prev,[name]:nextValue}));

    if(name==="documento") setDniError("");

  };

  const handlePhoneChange=(e)=>{

    const {name,value}=e.target;

    setNewClient(prev=>({...prev,[name]:value}));

  };

  const precioCalculado=()=>{

    const peso=parseFloat(form.pesoKg)||0;

    return peso>0 ? (peso<=2 ? 10 : 0) : null;

  };

  const handleCreateClient=async(e)=>{

    e.preventDefault();

    setNewClientLoading(true);

    try{

      const payload={
        ...newClient,
        tipo:newClient.tipoDocumento==="dni"?"persona":"empresa"
      };

      const created=await createClient(payload);

      setClients(prev=>[...prev,created]);

      setForm(prev=>({...prev,destinatarioId:String(created.id)}));

      setShowNewClient(false);

    }catch(err){

      setNewClientError(err.message || "No se pudo crear el destinatario.");

    }

    setNewClientLoading(false);

  };

  const handleSubmit=async(e)=>{

    e.preventDefault();

    setLoading(true);
    setError("");

    try{

      const peso=parseFloat(form.pesoKg)||0;

      await createClientPackage({
        ...form,
        pesoKg:peso
      });

      navigate("/cliente/envios");

    }catch(err){

      setError(err.message || "No se pudo crear el envío.");

    }

    setLoading(false);

  };

  const precio=precioCalculado();

  return(

<div className="relative min-h-screen flex justify-center pt-20 px-6 overflow-hidden">

<div
className="absolute inset-0 bg-cover bg-center transition-all duration-[2000ms]"
style={{
backgroundImage:`url(${backgroundImages[bgIndex]})`,
opacity:0.08
}}
/>

<div className="absolute inset-0 bg-gradient-to-br from-emerald-700/10 to-emerald-900/10"/>

<div className="relative w-full max-w-2xl z-10">

<h1 className="text-3xl font-bold text-emerald-700">
Enviar paquete
</h1>

<p className="text-slate-600 mt-1">
Tarifa estándar: 10 soles hasta 2 kg
</p>

<form
onSubmit={handleSubmit}
className="mt-8 space-y-6 bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-8 border"
>

<div>

<div className="flex justify-between items-center">

<label className="text-sm font-semibold">
Destinatario *
</label>

<button
type="button"
onClick={()=>setShowNewClient(true)}
className="text-emerald-600 text-sm font-semibold hover:underline"
>
+ Agregar nuevo
</button>

</div>

<select
name="destinatarioId"
value={form.destinatarioId}
onChange={handleChange}
required
className="w-full mt-2 border rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500"
>

<option value="">
Seleccionar destinatario
</option>

{clients.map(c=>(
<option key={c.id} value={c.id}>
{c.nombre} {c.documento ? `(${c.documento})` : ""}
</option>
))}

</select>

</div>

<label className="block text-sm font-semibold">

Sucursal de origen *

<select
name="sucursalOrigenId"
value={form.sucursalOrigenId}
onChange={handleChange}
required
className="w-full mt-2 border rounded-xl px-4 py-3"
>

<option value="">
Seleccionar sucursal
</option>

{branches.map(b=>(
<option key={b.id} value={b.id}>
{b.nombre} - {b.direccion}
</option>
))}

</select>

</label>

<label className="block text-sm font-semibold">

Dirección de entrega *

<input
name="destinoTexto"
value={form.destinoTexto}
onChange={handleChange}
required
className="w-full mt-2 border rounded-xl px-4 py-3"
/>

</label>

<label className="block text-sm font-semibold">

Descripción del paquete *

<input
name="descripcion"
value={form.descripcion}
onChange={handleChange}
required
className="w-full mt-2 border rounded-xl px-4 py-3"
/>

</label>

<label className="block text-sm font-semibold">

Peso (kg) *

<input
type="number"
name="pesoKg"
value={form.pesoKg}
onChange={handleChange}
required
className="w-full mt-2 border rounded-xl px-4 py-3"
/>

{precio!==null && (

<p className="mt-2 text-sm text-slate-600">

{precio>0
? <>Precio del envío: <strong>{precio} soles</strong></>
: <span className="text-amber-600">Precio asignado por operador</span>
}

</p>

)}

</label>

<div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

<p className="font-semibold text-sm">
¿Quién paga el envío?
</p>

<div className="mt-3 space-y-2">

<label className="flex gap-2 items-center">
<input
type="radio"
name="quienPaga"
value="remitente"
checked={form.quienPaga==="remitente"}
onChange={handleChange}
/>
Yo pago ahora
</label>

<label className="flex gap-2 items-center">
<input
type="radio"
name="quienPaga"
value="destinatario"
checked={form.quienPaga==="destinatario"}
onChange={handleChange}
/>
Paga el destinatario
</label>

</div>

</div>

{error && (
<div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">
{error}
</div>
)}

<div className="flex gap-4">

<button
type="button"
onClick={()=>navigate("/cliente")}
className="px-6 py-3 border rounded-full"
>
Cancelar
</button>

<button
type="submit"
disabled={loading}
className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-700 text-white rounded-full font-semibold shadow"
>
{loading ? "Enviando..." : "Crear envío"}
</button>

</div>

</form>

</div>

{/* MODAL NUEVO CLIENTE */}

{showNewClient && (
<div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">

<div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">

<h3 className="text-lg font-bold">
Nuevo destinatario
</h3>

<form onSubmit={handleCreateClient} className="mt-4 space-y-4">

<input
name="documento"
value={newClient.documento}
onChange={handleNewClientChange}
placeholder="DNI"
className="w-full border rounded-xl px-4 py-3"
/>

<input
name="nombre"
value={newClient.nombre}
onChange={handleNewClientChange}
placeholder="Nombre"
className="w-full border rounded-xl px-4 py-3"
/>

<PhoneField
countryValue={newClient.telefonoPais}
numberValue={newClient.telefonoNumero}
onChange={handlePhoneChange}
/>

<input
name="email"
value={newClient.email}
onChange={handleNewClientChange}
placeholder="Email"
className="w-full border rounded-xl px-4 py-3"
/>

<input
name="direccion"
value={newClient.direccion}
onChange={handleNewClientChange}
placeholder="Dirección"
className="w-full border rounded-xl px-4 py-3"
/>

<div className="flex justify-end gap-3">

<button
type="button"
onClick={()=>setShowNewClient(false)}
className="px-4 py-2 border rounded-lg"
>
Cancelar
</button>

<button
type="submit"
className="px-4 py-2 bg-emerald-600 text-white rounded-lg"
>
Guardar
</button>

</div>

</form>

</div>

</div>
)}

</div>

);

};

export default ClientPackageNew;