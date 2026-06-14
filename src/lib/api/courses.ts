import { call } from './client';

// ── Types ────────────────────────────────────────────────────────────────────

export type CourseTripType    = 'individual' | 'group';
export type CourseGroupType   = 'friends' | 'public';
export type CourseDirection   = 'one_way' | 'round_trip';
export type ScheduleDirection = 'go' | 'return';
export type SeatPosition      = 'front' | 'back_left' | 'back_center' | 'back_right';

export interface CourseStop {
  stop_order:   number;
  name:         string;
  province:     string;
  district:     string;
  sub_district: string;
  latitude:     number;
  longitude:    number;
}

export type CourseParticipant =
  | {
      type:          'passenger';
      passenger_id:  number;
      seat_position: SeatPosition;
    }
  | {
      type:          'user';
      user_id:       number;
      seat_position: SeatPosition;
    };

export interface WeeklyTripSchedule {
  day_of_week:        number;            // 0 = Sun … 6 = Sat
  trip_direction:     ScheduleDirection; // 'go' | 'return'
  start_time_from:    string;            // "HH:MM:SS"
  start_time_to:      string;
  end_time_from:      string;
  end_time_to:        string;

  from_province:      string;
  from_district:      string;
  from_sub_district:  string;
  pickup_point:       string;
  from_latitude:      number;
  from_longitude:     number;

  to_province:        string;
  to_district:        string;
  to_sub_district:    string;
  destination:        string;
  to_latitude:        number;
  to_longitude:       number;

  expected_distance:           number;
  estimated_duration_minutes:  number;

  participants:       CourseParticipant[];
  stops?:             CourseStop[];
}

export interface CoursePayload {
  trip_type:      CourseTripType;
  /** Required when trip_type === 'group'. */
  group_type?:    CourseGroupType;
  /** Required when group_type === 'friends'. */
  code_group?:    string;
  direction_type: CourseDirection;
  start_date:     string; // YYYY-MM-DD
  end_date:       string;
  estimated_total_price: number;
  notes:          string;
  weekly_trip_schedules: WeeklyTripSchedule[];
}

export interface CourseResponse {
  id: number;
  [key: string]: unknown;
}

// ── API ──────────────────────────────────────────────────────────────────────

export function createCourse(payload: CoursePayload): Promise<CourseResponse> {
  return call<CourseResponse>('courses', { method: 'POST', body: payload as unknown as Record<string, unknown> });
}

// ── Response types for GET /courses ──────────────────────────────────────────

export type CourseStatus  = 'draft' | 'pending_payment' | 'matching' | 'matching_failed' | 'partially_matched' | 'matched' | 'payment_required' | 'active' | 'completed' | 'cancelled' | 'pending' | 'ongoing' | 'confirmed';
export type WalletStatus  = 'waiting' | 'paid' | 'refunded' | 'success';

export interface ApiStop {
  stop_order: number;
  name:       string;
  latitude:   number;
  longitude:  number;
}

export interface ApiParticipant {
  id:            number;
  type:          'passenger' | 'user';
  user_id:       number | null;
  passenger_id:  number | null;
  seat_position: SeatPosition;
}

export interface ApiWeeklyTripSchedule {
  id:                         number;
  day_of_week:                number;        // 0 = Sun … 6 = Sat
  trip_direction:             ScheduleDirection;
  start_time_from:            string;        // "HH:MM:SS"
  start_time_to:              string;
  end_time_from:              string;
  end_time_to:                string;
  from_province:              string | null;
  from_district:              string | null;
  from_sub_district:          string | null;
  pickup_point:               string;
  from_latitude:              number;
  from_longitude:             number;
  to_province:                string | null;
  to_district:                string | null;
  to_sub_district:            string | null;
  destination:                string;
  to_latitude:                number;
  to_longitude:               number;
  expected_distance:          number;
  estimated_duration_minutes: number;
  participants:               ApiParticipant[];
  stops:                      ApiStop[];
}

export interface ApiCourse {
  id:                    number;
  trip_type:             CourseTripType;
  group_type:            string | null;
  code_group:            string | null;
  start_date:            string;  // "YYYY-MM-DD"
  end_date:              string;
  estimated_total_price: string;
  wallet_status:         WalletStatus;
  status:                CourseStatus;
  notes:                 string | null;
  created_at:            string;
  weekly_trip_schedules: ApiWeeklyTripSchedule[];
}

export interface GetCoursesResponse {
  success: boolean;
  data:    ApiCourse[];
  meta: {
    current_page: number;
    last_page:    number;
    total:        number;
  };
}

export function getCourses(): Promise<GetCoursesResponse> {
  return call<GetCoursesResponse>('courses');
}

export interface GetCourseResponse {
  success: boolean;
  data:    ApiCourse;
}

export function getCourse(id: number): Promise<GetCourseResponse> {
  return call<GetCourseResponse>(`courses/${id}`);
}

export interface ConfirmPaymentResponse {
  status:      string;
  payment_url: string;
  data: {
    id:                 number;
    user_id:            number;
    operation_type:     string;
    transaction_amount: number;
    balance_after:      number;
    status:             string;
    reason:             string | null;
    created_at:         string;
    updated_at:         string;
  };
}

export function confirmCoursePayment(id: number): Promise<ConfirmPaymentResponse> {
  return call<ConfirmPaymentResponse>(`courses/${id}/pay`, { method: 'POST' });
}

export interface UpdateStatusPayload {
  status:          CourseStatus;
  wallet_status?:  string;
}

export interface UpdateStatusResponse {
  success: boolean;
  data:    ApiCourse;
}

export function updateCourseStatus(id: number, payload: UpdateStatusPayload): Promise<UpdateStatusResponse> {
  return call<UpdateStatusResponse>(`courses/${id}/status`, { method: 'PUT', body: payload as unknown as Record<string, unknown> });
}

// ── Course Instances ──────────────────────────────────────────────────────────

export interface InstanceRoute {
  from_province:              string | null;
  from_district:              string | null;
  from_sub_district:          string | null;
  pickup_point:               string;
  from_latitude:              number;
  from_longitude:             number;
  to_province:                string | null;
  to_district:                string | null;
  to_sub_district:            string | null;
  destination:                string;
  to_latitude:                number;
  to_longitude:               number;
  expected_distance:          number;
  estimated_duration_minutes: number;
}

export interface InstanceParticipant {
  type:          'passenger' | 'user';
  user_id:       number | null;
  passenger_id:  number | null;
  seat_position: SeatPosition;
}

export interface ExecutionTimelineEvent {
  order:         number;
  type:          'pickup' | 'dropoff';
  user_id:       number;
  passenger_id:  number | null;
  events_logged: unknown[];
}

export interface CourseInstance {
  id:                      number;
  course_id:               number;
  weekly_trip_schedule_id: number;
  trip_date:               string;
  status:                  string;
  trip_direction:          ScheduleDirection;
  start_time_from:         string;
  start_time_to:           string;
  end_time_from:           string;
  end_time_to:             string;
  route:                   InstanceRoute;
  participants:            InstanceParticipant[];
  stops:                   unknown[];
  matching_status:         string;
  matching_group_code:     string | null;
  matching_price:          string | null;
  actual_start_time:       string | null;
  actual_end_time:         string | null;
  actual_route:            unknown | null;
  execution_timeline:      ExecutionTimelineEvent[] | null;
  driver_id:               number | null;
  driver_price:            string | null;
  tracking:                unknown | null;
}

export interface GetCourseInstancesResponse {
  success: boolean;
  data:    CourseInstance[];
  meta: {
    current_page: number;
    last_page:    number;
    total:        number;
  };
}

export interface GetCourseInstanceResponse {
  success: boolean;
  data:    CourseInstance;
}

export function getCourseInstances(courseId: number): Promise<GetCourseInstancesResponse> {
  return call<GetCourseInstancesResponse>(`courses/${courseId}/instances`);
}

export function getCourseInstance(courseId: number, instanceId: number): Promise<GetCourseInstanceResponse> {
  return call<GetCourseInstanceResponse>(`courses/${courseId}/instances/${instanceId}`);
}

// ── Repeat Course ────────────────────────────────────────────────────────────

export interface RepeatCoursePayload {
  start_date: string; // YYYY-MM-DD
}

export interface RepeatCourseResponse {
  success: boolean;
  data:    ApiCourse;
}

export function repeatCourse(courseId: number, payload: RepeatCoursePayload): Promise<RepeatCourseResponse> {
  return call<RepeatCourseResponse>(`courses/${courseId}/repeat`, { method: 'POST', body: payload as unknown as Record<string, unknown> });
}
