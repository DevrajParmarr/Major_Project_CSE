const Optimization = require('../models/Optimization');
const Vehicle = require('../models/Vehicle');
const Location = require('../models/Location');

// Get all optimizations
exports.getOptimizations = async (req, res) => {
  try {
    const optimizations = await Optimization.find({ user: req.user.id })
      .populate('vehicles')
      .populate('locations')
      .sort({ date: -1 });
    res.json(optimizations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Get optimization by ID
exports.getOptimizationById = async (req, res) => {
  try {
    const optimization = await Optimization.findById(req.params.id)
      .populate('vehicles')
      .populate('locations');
    
    // Check if optimization exists
    if (!optimization) {
      return res.status(404).json({ msg: 'Optimization not found' });
    }
    
    // Check user
    if (optimization.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    
    res.json(optimization);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Optimization not found' });
    }
    res.status(500).send('Server error');
  }
};

// Create optimization
exports.createOptimization = async (req, res) => {
  const { name, vehicleIds, locationIds } = req.body;
  
  try {
    // Get vehicles and locations
    const vehicles = await Vehicle.find({ 
      _id: { $in: vehicleIds },
      user: req.user.id
    });
    
    const locations = await Location.find({
      _id: { $in: locationIds },
      user: req.user.id
    });
    
    if (vehicles.length === 0 || locations.length === 0) {
      return res.status(400).json({ msg: 'Vehicles or locations not found' });
    }
    
    // Find depot (or use first location as depot)
    const depot = locations.find(loc => loc.isDepot) || locations[0];
    
    // Choose optimization algorithm
    const selected = (req.body.algorithm || 'clarke-wright').toLowerCase();
    const routes = selected === 'nearest-neighbor'
      ? nearestNeighborAlgorithm(vehicles, locations, depot)
      : clarkeWrightAlgorithm(vehicles, locations, depot);
    
    // Calculate total distance and duration
    let totalDistance = 0;
    let totalDuration = 0;
    routes.forEach(route => {
      totalDistance += route.distance || 0;
      totalDuration += route.duration || 0;
    });
    
    const newOptimization = new Optimization({
      name,
      vehicles: vehicleIds,
      locations: locationIds,
      routes,
      totalDistance,
      totalDuration,
      user: req.user.id
    });
    
    const optimization = await newOptimization.save();
    
    // Populate the response
    const populatedOptimization = await Optimization.findById(optimization._id)
      .populate('vehicles')
      .populate('locations');
    
    res.json(populatedOptimization);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Delete optimization
exports.deleteOptimization = async (req, res) => {
  try {
    const optimization = await Optimization.findById(req.params.id);
    
    // Check if optimization exists
    if (!optimization) {
      return res.status(404).json({ msg: 'Optimization not found' });
    }
    
    // Check user
    if (optimization.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    
    await optimization.remove();
    res.json({ msg: 'Optimization removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Optimization not found' });
    }
    res.status(500).send('Server error');
  }
};

// Enhanced Clarke-Wright algorithm with proper endpoint merges, capacity checks, and post-assignment
function clarkeWrightAlgorithm(vehicles, locations, depot) {
  const speedKmh = 40; // average speed for duration estimation

  const toId = (objId) => objId.toString();

  // Build distance matrix keyed by string ids
  const distances = {};
  const allIds = locations.map((l) => toId(l._id));
  locations.forEach((l1) => {
    const id1 = toId(l1._id);
    distances[id1] = {};
    locations.forEach((l2) => {
      const id2 = toId(l2._id);
      distances[id1][id2] = calculateDistance(
        l1.latitude,
        l1.longitude,
        l2.latitude,
        l2.longitude
      );
    });
  });

  const depotId = toId(depot._id);
  const nonDepot = locations.filter((l) => toId(l._id) !== depotId);

  // Initial routes: depot -> i -> depot
  const makeDepotStop = (order) => ({
    locationId: depot._id,
    locationName: depot.name,
    latitude: depot.latitude,
    longitude: depot.longitude,
    demand: depot.demand || 0,
    order
  });

  const routes = nonDepot.map((loc) => {
    const stops = [
      makeDepotStop(0),
      {
        locationId: loc._id,
        locationName: loc.name,
        latitude: loc.latitude,
        longitude: loc.longitude,
        demand: loc.demand || 0,
        order: 1
      },
      makeDepotStop(2)
    ];
    const distance = distances[depotId][toId(loc._id)] * 2;
    const duration = Math.round((distance / speedKmh) * 60);
    return {
      vehicle: undefined,
      vehicleName: 'Unassigned',
      stops,
      distance,
      duration,
      totalCapacity: loc.demand || 0
    };
  });

  // Savings list
  const savings = [];
  for (let i = 0; i < nonDepot.length; i++) {
    for (let j = i + 1; j < nonDepot.length; j++) {
      const li = nonDepot[i];
      const lj = nonDepot[j];
      const idI = toId(li._id);
      const idJ = toId(lj._id);
      const saving =
        distances[depotId][idI] + distances[depotId][idJ] - distances[idI][idJ];
      savings.push({ i: li, j: lj, saving });
    }
  }
  savings.sort((a, b) => b.saving - a.saving);

  const maxCapacity = vehicles.length > 0 ? Math.max(...vehicles.map((v) => v.capacity || 0)) : Infinity;

  const findRouteIndexByLocation = (idStr) => {
    for (let r = 0; r < routes.length; r++) {
      const rt = routes[r];
      const foundIdx = rt.stops.findIndex((s) => toId(s.locationId) === idStr);
      if (foundIdx !== -1) {
        return { routeIndex: r, stopIndex: foundIdx };
      }
    }
    return null;
  };

  const isStartEndpoint = (rt, idx) => idx === 1; // first non-depot
  const isEndEndpoint = (rt, idx) => idx === rt.stops.length - 2; // last non-depot

  const recomputeRouteMetrics = (rt) => {
    let dist = 0;
    for (let k = 0; k < rt.stops.length - 1; k++) {
      const from = rt.stops[k];
      const to = rt.stops[k + 1];
      const fromId = toId(from.locationId);
      const toIdStr = toId(to.locationId);
      dist += distances[fromId]?.[toIdStr] ?? calculateDistance(from.latitude, from.longitude, to.latitude, to.longitude);
    }
    rt.distance = dist;
    rt.duration = Math.round((dist / speedKmh) * 60);
  };

  // Merge using savings
  for (const s of savings) {
    const idI = toId(s.i._id);
    const idJ = toId(s.j._id);

    const posI = findRouteIndexByLocation(idI);
    const posJ = findRouteIndexByLocation(idJ);
    if (!posI || !posJ) continue;
    if (posI.routeIndex === posJ.routeIndex) continue;

    const r1 = routes[posI.routeIndex];
    const r2 = routes[posJ.routeIndex];

    const iAtEndOfR1 = isEndEndpoint(r1, posI.stopIndex);
    const iAtStartOfR1 = isStartEndpoint(r1, posI.stopIndex);
    const jAtEndOfR2 = isEndEndpoint(r2, posJ.stopIndex);
    const jAtStartOfR2 = isStartEndpoint(r2, posJ.stopIndex);

    let newStops = null;

    // Case 1: i at end of r1, j at start of r2 -> r1 + r2
    if (iAtEndOfR1 && jAtStartOfR2) {
      newStops = [
        ...r1.stops.slice(0, -1), // r1 without final depot
        ...r2.stops.slice(1) // r2 without initial depot
      ];
    }
    // Case 2: j at end of r2, i at start of r1 -> r2 + r1
    else if (jAtEndOfR2 && iAtStartOfR1) {
      newStops = [
        ...r2.stops.slice(0, -1),
        ...r1.stops.slice(1)
      ];
    }

    if (!newStops) continue; // endpoints not mergeable per CW

    const combinedDemand = (r1.totalCapacity || 0) + (r2.totalCapacity || 0);
    if (combinedDemand > maxCapacity) continue;

    // Reorder with updated orders
    newStops = newStops.map((st, idx) => ({ ...st, order: idx }));
    const merged = {
      vehicle: undefined,
      vehicleName: 'Unassigned',
      stops: newStops,
      distance: 0,
      duration: 0,
      totalCapacity: combinedDemand
    };
    recomputeRouteMetrics(merged);

    // Replace two routes with merged
    const idxToRemove = Math.max(posI.routeIndex, posJ.routeIndex);
    const idxToReplace = Math.min(posI.routeIndex, posJ.routeIndex);
    routes.splice(idxToRemove, 1);
    routes.splice(idxToReplace, 1, merged);
  }

  // If more routes than available vehicles, try to merge smallest-demand routes while feasible
  const totalVehicleSlots = vehicles.reduce((sum, v) => sum + (v.count || 0), 0);
  if (Number.isFinite(totalVehicleSlots) && totalVehicleSlots > 0) {
    let guard = 0;
    while (routes.length > totalVehicleSlots && guard < 1000) {
      guard++;
      // sort by demand asc
      routes.sort((a, b) => (a.totalCapacity || 0) - (b.totalCapacity || 0));
      let mergedAny = false;
      for (let a = 0; a < routes.length - 1; a++) {
        for (let b = a + 1; b < routes.length; b++) {
          const ra = routes[a];
          const rb = routes[b];
          if ((ra.totalCapacity || 0) + (rb.totalCapacity || 0) > maxCapacity) continue;
          // attempt endpoint merge ra end + rb start or rb end + ra start
          const raEndId = toId(ra.stops[ra.stops.length - 2].locationId);
          const raStartId = toId(ra.stops[1].locationId);
          const rbEndId = toId(rb.stops[rb.stops.length - 2].locationId);
          const rbStartId = toId(rb.stops[1].locationId);

          let ns = null;
          if (distances[raEndId] && distances[raEndId][rbStartId] != null) {
            ns = [...ra.stops.slice(0, -1), ...rb.stops.slice(1)];
          } else if (distances[rbEndId] && distances[rbEndId][raStartId] != null) {
            ns = [...rb.stops.slice(0, -1), ...ra.stops.slice(1)];
          }
          if (!ns) continue;

          ns = ns.map((st, i) => ({ ...st, order: i }));
          const mergedR = {
            vehicle: undefined,
            vehicleName: 'Unassigned',
            stops: ns,
            distance: 0,
            duration: 0,
            totalCapacity: (ra.totalCapacity || 0) + (rb.totalCapacity || 0)
          };
          recomputeRouteMetrics(mergedR);

          // replace a and b with mergedR
          routes.splice(b, 1);
          routes.splice(a, 1, mergedR);
          mergedAny = true;
          break;
        }
        if (mergedAny) break;
      }
      if (!mergedAny) break;
    }
  }

  // Assign vehicles greedily (largest demand first)
  const vehicleSlots = [];
  vehicles.forEach((v) => {
    const count = v.count || 1;
    for (let i = 0; i < count; i++) {
      vehicleSlots.push({ _id: v._id, name: v.name, capacity: v.capacity || 0, used: false });
    }
  });
  routes.sort((a, b) => (b.totalCapacity || 0) - (a.totalCapacity || 0));
  vehicleSlots.sort((a, b) => b.capacity - a.capacity);

  for (const r of routes) {
    const slot = vehicleSlots.find((vs) => !vs.used && vs.capacity >= (r.totalCapacity || 0));
    if (slot) {
      r.vehicle = slot._id;
      r.vehicleName = slot.name;
      slot.used = true;
    } else {
      // Leave unassigned if no suitable slot
      r.vehicle = undefined;
      r.vehicleName = 'Unassigned';
    }
  }

  // Recompute metrics post-assignment (no change, but ensures consistency)
  routes.forEach(recomputeRouteMetrics);

  // Local search refinement (2-opt then 3-opt) per route excluding depots
  routes.forEach((r) => {
    improveRouteWithLocalSearch(r, distances, speedKmh);
  });
  return routes;
}

function improveRouteWithLocalSearch(route, distances, speedKmh) {
  // Extract non-depot stops
  if (!route.stops || route.stops.length < 3) return;
  const first = route.stops[0];
  const last = route.stops[route.stops.length - 1];
  const middle = route.stops.slice(1, -1);

  const toId = (x) => x.locationId.toString();
  const calcDist = (seq) => {
    let d = 0;
    for (let i = 0; i < seq.length - 1; i++) {
      const a = seq[i];
      const b = seq[i + 1];
      const ai = toId(a);
      const bi = toId(b);
      d += distances[ai]?.[bi] ?? calculateDistance(a.latitude, a.longitude, b.latitude, b.longitude);
    }
    return d;
  };

  // 2-opt improvement
  let improved = true;
  let seq = [first, ...middle, last];
  while (improved) {
    improved = false;
    for (let i = 1; i < seq.length - 2; i++) {
      for (let k = i + 1; k < seq.length - 1; k++) {
        const newSeq = [...seq.slice(0, i), ...seq.slice(i, k + 1).reverse(), ...seq.slice(k + 1)];
        if (calcDist(newSeq) + 1e-9 < calcDist(seq)) {
          seq = newSeq;
          improved = true;
        }
      }
    }
  }

  // 3-opt limited improvement (simple swap of three segments)
  const threeOptOnce = () => {
    for (let i = 1; i < seq.length - 3; i++) {
      for (let j = i + 1; j < seq.length - 2; j++) {
        for (let k = j + 1; k < seq.length - 1; k++) {
          const A = seq.slice(0, i);
          const B = seq.slice(i, j);
          const C = seq.slice(j, k);
          const D = seq.slice(k);
          const candidates = [
            [...A, ...B, ...C, ...D], // original
            [...A, ...B.reverse(), ...C, ...D],
            [...A, ...B, ...C.reverse(), ...D],
            [...A, ...C, ...B, ...D],
            [...A, ...C.reverse(), ...B, ...D],
            [...A, ...B.reverse(), ...C.reverse(), ...D],
          ];
          const base = calcDist(seq);
          let best = seq;
          let bestD = base;
          for (const cand of candidates) {
            const d = calcDist(cand);
            if (d + 1e-9 < bestD) {
              bestD = d;
              best = cand;
            }
          }
          if (best !== seq) {
            seq = best;
            return true;
          }
        }
      }
    }
    return false;
  };

  if (threeOptOnce()) {
    // run a brief 2-opt again
    let changed = true;
    while (changed) {
      changed = false;
      for (let i = 1; i < seq.length - 2; i++) {
        for (let k = i + 1; k < seq.length - 1; k++) {
          const newSeq = [...seq.slice(0, i), ...seq.slice(i, k + 1).reverse(), ...seq.slice(k + 1)];
          if (calcDist(newSeq) + 1e-9 < calcDist(seq)) {
            seq = newSeq;
            changed = true;
          }
        }
      }
    }
  }

  // Rebuild route
  route.stops = seq.map((s, idx) => ({ ...s, order: idx }));
  // Recompute metrics
  let totalDistance = 0;
  for (let i = 0; i < route.stops.length - 1; i++) {
    const a = route.stops[i];
    const b = route.stops[i + 1];
    const ai = toId(a);
    const bi = toId(b);
    totalDistance += distances[ai]?.[bi] ?? calculateDistance(a.latitude, a.longitude, b.latitude, b.longitude);
  }
  route.distance = totalDistance;
  route.duration = Math.round((totalDistance / speedKmh) * 60);
}

// Nearest Neighbor heuristic with capacity awareness
function nearestNeighborAlgorithm(vehicles, locations, depot) {
  const speedKmh = 40;
  const toId = (id) => id.toString();
  const depotId = toId(depot._id);
  const pending = locations.filter((l) => toId(l._id) !== depotId);

  // Expand vehicles by count
  const vehicleSlots = [];
  vehicles.forEach((v) => {
    const count = v.count || 1;
    for (let i = 0; i < count; i++) {
      vehicleSlots.push({ _id: v._id, name: v.name, capacity: v.capacity || 0 });
    }
  });

  const routes = [];
  const used = new Set();

  const dist = (a, b) => calculateDistance(a.latitude, a.longitude, b.latitude, b.longitude);

  for (const vs of vehicleSlots) {
    let remaining = vs.capacity;
    const rtStops = [
      {
        locationId: depot._id,
        locationName: depot.name,
        latitude: depot.latitude,
        longitude: depot.longitude,
        demand: depot.demand || 0,
        order: 0,
      },
    ];

    let current = depot;
    let order = 1;

    while (true) {
      // pick nearest not used, within remaining capacity
      let best = null;
      let bestD = Infinity;
      for (const loc of pending) {
        if (used.has(toId(loc._id))) continue;
        if ((loc.demand || 0) > remaining) continue;
        const d = dist(current, loc);
        if (d < bestD) {
          bestD = d;
          best = loc;
        }
      }
      if (!best) break;

      rtStops.push({
        locationId: best._id,
        locationName: best.name,
        latitude: best.latitude,
        longitude: best.longitude,
        demand: best.demand || 0,
        order: order++,
      });
      remaining -= best.demand || 0;
      used.add(toId(best._id));
      current = best;
    }

    // Close route if it visited something
    if (rtStops.length > 1) {
      rtStops.push({
        locationId: depot._id,
        locationName: depot.name,
        latitude: depot.latitude,
        longitude: depot.longitude,
        demand: depot.demand || 0,
        order: order,
      });

      let totalDist = 0;
      for (let i = 0; i < rtStops.length - 1; i++) {
        totalDist += calculateDistance(rtStops[i].latitude, rtStops[i].longitude, rtStops[i + 1].latitude, rtStops[i + 1].longitude);
      }
      const duration = Math.round((totalDist / speedKmh) * 60);

      routes.push({
        vehicle: vs._id,
        vehicleName: vs.name,
        stops: rtStops,
        distance: totalDist,
        duration,
        totalCapacity: rtStops.reduce((s, st) => s + (st.demand || 0), 0) - (depot.demand || 0),
      });
    }

    // stop early if all assigned
    if (used.size === pending.length) break;
  }

  // Any unassigned left? Try to add them as separate small routes if possible
  for (const loc of pending) {
    if (used.has(toId(loc._id))) continue;
    // pick any vehicle that can cover it
    const vs = vehicleSlots.find((v) => (v.capacity || 0) >= (loc.demand || 0));
    if (!vs) continue;

    const stops = [
      {
        locationId: depot._id,
        locationName: depot.name,
        latitude: depot.latitude,
        longitude: depot.longitude,
        demand: depot.demand || 0,
        order: 0,
      },
      {
        locationId: loc._id,
        locationName: loc.name,
        latitude: loc.latitude,
        longitude: loc.longitude,
        demand: loc.demand || 0,
        order: 1,
      },
      {
        locationId: depot._id,
        locationName: depot.name,
        latitude: depot.latitude,
        longitude: depot.longitude,
        demand: depot.demand || 0,
        order: 2,
      },
    ];
    const d = dist(depot, loc) * 2;
    routes.push({
      vehicle: vs._id,
      vehicleName: vs.name,
      stops,
      distance: d,
      duration: Math.round((d / speedKmh) * 60),
      totalCapacity: loc.demand || 0,
    });
    used.add(toId(loc._id));
  }

  return routes;
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance;
}

// Get routed polyline and metrics from OSRM for a stop sequence
async function getOsrmRouteForStops(stops) {
  // OSRM public demo server (rate-limited); for production, host your own
  const base = 'https://router.project-osrm.org/route/v1/driving/';
  const coords = stops.map(s => `${s.longitude},${s.latitude}`).join(';');
  const url = `${base}${coords}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('OSRM request failed');
    const data = await res.json();
    if (!data.routes || data.routes.length === 0) throw new Error('No OSRM route');
    const r = data.routes[0];
    return {
      geometry: r.geometry, // GeoJSON LineString
      distanceKm: (r.distance || 0) / 1000,
      durationMin: Math.round((r.duration || 0) / 60)
    };
  } catch (e) {
    console.error('OSRM error:', e.message);
    return null;
  }
}

// API helper to route a given route's stops
exports.getRoutedPolyline = async (req, res) => {
  try {
    const { id, routeIndex } = req.params;
    const optimization = await Optimization.findById(id);
    if (!optimization) return res.status(404).json({ msg: 'Optimization not found' });
    if (optimization.user.toString() !== req.user.id) return res.status(401).json({ msg: 'User not authorized' });
    const route = optimization.routes[Number(routeIndex)];
    if (!route) return res.status(404).json({ msg: 'Route not found' });

    const osrm = await getOsrmRouteForStops(route.stops);
    if (!osrm) return res.status(502).json({ msg: 'Failed to get routed polyline' });

    res.json(osrm);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};