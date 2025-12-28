import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapService } from '../../services/map.service';


@Component({
    selector: 'app-map',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {
    @Input() carregando: boolean = false;
    @Input() mapaCarregado: boolean = false;

    constructor(public mapService: MapService) { }

    ngOnInit(): void {

    }
}
